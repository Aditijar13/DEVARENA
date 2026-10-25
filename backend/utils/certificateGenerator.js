const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { cloudinary } = require('../config/cloudinary');
const { Certificate } = require('../models/Supplementary');
const User = require('../models/User');
const { checkAndAwardBadges } = require('./gamification');
const { sendCertificateEmail } = require('./emailService');
const stream = require('stream');

const generateCertificate = async (user, event, type = 'participation', metadata = {}) => {
  try {
    const certificateId = `DA-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const verificationUrl = `${process.env.CLIENT_URL}/verify-certificate/${certificateId}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 150,
      margin: 2,
      color: { dark: '#6366f1', light: '#ffffff' },
    });
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Generate PDF
    const pdfBuffer = await createPDF({ user, event, type, certificateId, verificationUrl, qrBuffer, metadata });

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'devarena/certificates', resource_type: 'raw', format: 'pdf', public_id: certificateId },
        (err, result) => err ? reject(err) : resolve(result)
      );
      uploadStream.end(pdfBuffer);
    });

    // Save certificate record
    const cert = await Certificate.create({
      user: user._id,
      event: event._id,
      certificateId,
      type,
      issuedAt: new Date(),
      downloadUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      qrCode: qrCodeDataUrl,
      verificationUrl,
      metadata,
    });

    // Update user stats
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'stats.certificatesEarned': 1, points: 50 },
    });

    await checkAndAwardBadges(user._id, 'get_certificate');

    // Send email
    try {
      await sendCertificateEmail(user, event, uploadResult.secure_url);
    } catch (emailErr) {
      console.error('Certificate email error:', emailErr.message);
    }

    return cert;
  } catch (error) {
    console.error('Certificate generation error:', error.message);
    throw error;
  }
};

const createPDF = ({ user, event, type, certificateId, verificationUrl, qrBuffer, metadata }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = 841.89; // A4 landscape width
    const H = 595.28; // A4 landscape height

    // Background
    doc.rect(0, 0, W, H).fill('#0a0a0f');

    // Decorative border
    doc.rect(20, 20, W - 40, H - 40).lineWidth(2).stroke('#6366f1');
    doc.rect(28, 28, W - 56, H - 56).lineWidth(0.5).stroke('#4f46e5');

    // Top gradient bar
    const topGradient = doc.linearGradient(0, 0, W, 0);
    topGradient.stop(0, '#6366f1').stop(0.5, '#8b5cf6').stop(1, '#a855f7');
    doc.rect(0, 0, W, 8).fill(topGradient);

    // Corner decorations
    const drawCorner = (x, y, rotate) => {
      doc.save();
      doc.translate(x, y).rotate(rotate);
      doc.moveTo(0, 0).lineTo(60, 0).lineTo(60, 4).lineTo(4, 4).lineTo(4, 60).lineTo(0, 60).closePath();
      doc.fill('#6366f1');
      doc.restore();
    };
    drawCorner(30, 30, 0);
    drawCorner(W - 30, 30, 90);
    drawCorner(W - 30, H - 30, 180);
    drawCorner(30, H - 30, 270);

    // Logo & Brand
    doc.fontSize(28).font('Helvetica-Bold').fill('#6366f1').text(' DevArena', 60, 55);
    doc.fontSize(10).font('Helvetica').fill('#64748b').text('The Developer Event Platform', 60, 90);

    // Certificate type badge
    const badgeText = type === 'winner' ? ' WINNER' : type === 'runner-up' ? '[RUNNER-UP] RUNNER UP' : ' CERTIFICATE OF PARTICIPATION';
    doc.roundedRect(W / 2 - 150, 45, 300, 36, 18)
      .fill('#1e1e2e');
    doc.fontSize(11).font('Helvetica-Bold').fill('#a855f7')
      .text(badgeText, W / 2 - 150, 57, { width: 300, align: 'center' });

    // Main title
    doc.fontSize(14).font('Helvetica').fill('#64748b')
      .text('THIS IS TO CERTIFY THAT', 0, 155, { width: W, align: 'center' });

    // Recipient name
    doc.fontSize(42).font('Helvetica-Bold').fill('#e2e8f0')
      .text(user.name, 0, 185, { width: W, align: 'center' });

    // Decorative line under name
    const nameWidth = Math.min(doc.widthOfString(user.name, { fontSize: 42 }) + 40, 400);
    doc.moveTo(W / 2 - nameWidth / 2, 240).lineTo(W / 2 + nameWidth / 2, 240)
      .lineWidth(2).stroke('#6366f1');

    // Description
    const desc = type === 'participation'
      ? `has successfully participated in`
      : type === 'winner' ? `has won 1st place in`
      : type === 'runner-up' ? `achieved 2nd place in`
      : `has contributed to`;

    doc.fontSize(14).font('Helvetica').fill('#94a3b8')
      .text(desc, 0, 258, { width: W, align: 'center' });

    // Event name
    doc.fontSize(22).font('Helvetica-Bold').fill('#6366f1')
      .text(event.title, 80, 285, { width: W - 160, align: 'center' });

    // Event details
    const startDate = new Date(event.startDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.fontSize(11).font('Helvetica').fill('#64748b')
      .text(`Held on ${startDate} · ${event.mode?.toUpperCase() || 'ONLINE'}`, 0, 325, { width: W, align: 'center' });

    if (metadata.rank) {
      doc.fontSize(11).fill('#f59e0b')
        .text(`Rank: #${metadata.rank}${metadata.score ? ` · Score: ${metadata.score}` : ''}`, 0, 348, { width: W, align: 'center' });
    }

    // Divider
    doc.moveTo(80, 390).lineTo(W - 80, 390).lineWidth(0.5).stroke('#1e1e2e');

    // Certificate ID
    doc.fontSize(9).font('Helvetica').fill('#475569')
      .text(`Certificate ID: ${certificateId}`, 80, 405);
    doc.fontSize(9).fill('#475569')
      .text(`Verify at: ${verificationUrl}`, 80, 420);

    // Issue date
    doc.fontSize(9).fill('#475569')
      .text(`Issued on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 80, 435);

    // Signature placeholder
    doc.moveTo(W - 250, 430).lineTo(W - 100, 430).lineWidth(1).stroke('#334155');
    doc.fontSize(10).fill('#64748b').text('Authorized Signature', W - 250, 438, { width: 150, align: 'center' });

    // QR Code
    if (qrBuffer) {
      doc.image(qrBuffer, W - 180, 345, { width: 80, height: 80 });
      doc.fontSize(8).fill('#475569').text('Scan to verify', W - 175, 430, { width: 70, align: 'center' });
    }

    doc.end();
  });
};

module.exports = { generateCertificate };
