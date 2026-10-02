const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const generateInvoice = (payment, user, therapist, clientPackage = null) => {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDirectory = path.join(
        __dirname,
        "../../invoices"
      );

      if (!fs.existsSync(invoicesDirectory)) {
        fs.mkdirSync(invoicesDirectory, {
          recursive: true,
        });
      }

      const invoiceNumber = `INV-${Date.now()}`;
      const fileName = `${invoiceNumber}.pdf`;
      const filePath = path.join(
        invoicesDirectory,
        fileName
      );

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      doc
        .fontSize(24)
        .fillColor("#203d35")
        .text("UNFAZED", { align: "left" });
      doc
        .fontSize(10)
        .fillColor("#6f7f78")
        .text("Mental Health Practice Platform");
      doc.moveDown(2);
      doc
        .fontSize(20)
        .fillColor("#203d35")
        .text("TAX INVOICE");
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor("#555555")
        .text(`Invoice Number: ${invoiceNumber}`)
        .text(
          `Invoice Date: ${new Date(
            payment.createdAt || Date.now()
          ).toLocaleDateString("en-IN")}`
        );
      doc.moveDown(1.5);
      doc
        .fontSize(12)
        .fillColor("#203d35")
        .text("Bill To");
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .fillColor("#444444")
        .text(`Name: ${user?.name || "Client"}`)
        .text(`Email: ${user?.email || "N/A"}`);
      doc.moveDown(1);
      doc
        .fontSize(12)
        .fillColor("#203d35")
        .text("Therapist");

      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .fillColor("#444444")
        .text(
          `Name: ${therapist?.name || "Therapist"}`
        );
      doc.moveDown(1.5);
      doc
        .fontSize(12)
        .fillColor("#203d35")
        .text("Payment Details");
      doc.moveDown(0.7);
      const description = clientPackage
        ? `${clientPackage.package?.name || "Session Package"}`
        : "Therapy Session";
      const amount = Number(payment.amount || 0);
      const platformFee = Number(
        payment.platformFee || 0
      );
      const netAmount = Number(
        payment.netAmount || amount
      );

      doc
        .fontSize(10)
        .fillColor("#ffffff")
        .rect(50, doc.y, 495, 25)
        .fill("#315f51");

      const headerY = doc.y + 7;

      doc
        .fillColor("#ffffff")
        .text("Description", 60, headerY, {
          width: 250,
        })
        .text("Amount", 400, headerY, {
          width: 130,
          align: "right",
        });

      doc.moveDown(2);
      const rowY = doc.y;
      doc
        .fontSize(10)
        .fillColor("#333333")
        .text(description, 60, rowY, {
          width: 250,
        })
        .text(`₹${amount.toFixed(2)}`, 400, rowY, {
          width: 130,
          align: "right",
        });
      doc.moveDown(2);
      doc
        .fontSize(10)
        .fillColor("#555555")
        .text(
          `Platform Fee: ₹${platformFee.toFixed(2)}`,
          300,
          doc.y,
          {
            width: 230,
            align: "right",
          }
        );
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .fillColor("#203d35")
        .text(
          `Net Amount: ₹${netAmount.toFixed(2)}`,
          300,
          doc.y,
          {
            width: 230,
            align: "right",
          }
        );
      doc.moveDown(1);
      doc
        .fontSize(10)
        .fillColor("#315f51")
        .text(
          `Payment Status: ${
            payment.status || "captured"
          }`.toUpperCase(),
          300,
          doc.y,
          {
            width: 230,
            align: "right",
          }
        );

      doc.moveDown(2);
      if (clientPackage) {
        doc
          .fontSize(12)
          .fillColor("#203d35")
          .text("Package Information");

        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .fillColor("#444444")
          .text(
            `Sessions Purchased: ${
              clientPackage.sessionsPurchased || 0
            }`
          )
          .text(
            `Valid Until: ${
              clientPackage.expiryDate
                ? new Date(
                    clientPackage.expiryDate
                  ).toLocaleDateString("en-IN")
                : "N/A"
            }`
          );
        doc.moveDown(1.5);
      }
      doc
        .fontSize(9)
        .fillColor("#777777")
        .text(
          "This is a system-generated invoice from UNFAZED.",
          50,
          740,
          {
            align: "center",
            width: 495,
          }
        );
      doc
        .fontSize(9)
        .text(
          "Thank you for using UNFAZED.",
          50,
          755,
          {
            align: "center",
            width: 495,
          }
        );

      doc.end();
      stream.on("finish", () => {
        resolve({
          invoiceNumber,
          fileName,
          filePath,
        });
      });
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};
module.exports = generateInvoice;
