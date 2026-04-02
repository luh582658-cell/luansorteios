import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Initialize Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-6316810641846663-040107-ba35f906535bd1ab363ab9eda0c951e4-160832623' 
});
const payment = new Payment(client);

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'seu-email@gmail.com',
    pass: process.env.SMTP_PASS || 'sua-senha-de-app',
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post('/api/payments', async (req, res) => {
    try {
      const { amount, email, description, paymentId } = req.body;

      const body = {
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email,
        },
        external_reference: paymentId, // Used to link MP payment to our internal payment ID
      };

      const result = await payment.create({ body });
      
      res.json({
        id: result.id,
        status: result.status,
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  // Webhook for Mercado Pago
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    try {
      const { action, data } = req.body;
      
      if (action === 'payment.created' || action === 'payment.updated') {
        const paymentId = data.id;
        
        // Let the client poll the status from MP directly via our backend
        // We won't update Firestore here directly to avoid complex auth setup in Node without Admin SDK.
        // Instead, the client will poll /api/payments/:id/status and update Firestore itself.
        // This is a simplified approach for the prototype.
        console.log(`Webhook received for payment ${paymentId}`);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Error processing webhook');
    }
  });

  // Endpoint for client to poll payment status
  app.get('/api/payments/:id/status', async (req, res) => {
    try {
      const id = req.params.id;
      const result = await payment.get({ id });
      
      res.json({
        id: result.id,
        status: result.status,
        external_reference: result.external_reference
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({ error: 'Failed to fetch payment status' });
    }
  });

  // Endpoint to send confirmation email
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, raffleName, tickets } = req.body;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Obrigado por participar! 🎉</h2>
          <p style="color: #555; font-size: 16px;">Sua compra para a rifa <strong>${raffleName}</strong> foi confirmada com sucesso.</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
            <h3 style="margin-top: 0; color: #333;">Seus Números da Sorte:</h3>
            <p style="font-size: 18px; font-weight: bold; color: #000; letter-spacing: 1px;">
              ${tickets.join(', ')}
            </p>
          </div>
          
          <p style="color: #555; font-size: 14px;">Você pode acompanhar seus números e o resultado do sorteio diretamente no nosso site acessando a área "Meus Números".</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">Luan Sorteios - Reserva/PR</p>
            <p style="color: #888; font-size: 12px;">Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"Luan Sorteios" <' + (process.env.SMTP_USER || 'noreply@luansorteios.com') + '>',
        to,
        subject,
        html: htmlContent,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      // We return success anyway so the UI doesn't break if SMTP is not configured
      res.status(200).json({ success: false, message: 'Email not configured' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
