// EmailService - Sistema de Emails com SendGrid
// Suporta SendGrid e fallback para log (desenvolvimento)

import sgMail from '@sendgrid/mail';

// Configurar SendGrid (se API key estiver disponível)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Envia um email usando SendGrid ou fallback para log
   */
  static async sendEmail(data: EmailData): Promise<void> {
    try {
      // Se SendGrid não estiver configurado, usar log
      if (!process.env.SENDGRID_API_KEY) {
        console.log('⚠️ SendGrid não configurado. Usando log como fallback.');
        console.log('📧 EMAIL ENVIADO (modo desenvolvimento):');
        console.log('Para:', data.to);
        console.log('Assunto:', data.subject);
        console.log('Conteúdo:', data.html.substring(0, 200) + '...');
        return;
      }

      // Enviar via SendGrid
      const msg = {
        to: data.to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@primeiratroca.com.br',
          name: process.env.SENDGRID_FROM_NAME || 'Primeira Troca',
        },
        subject: data.subject,
        html: data.html,
        text: data.text || data.html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n'),
      };

      await sgMail.send(msg);
      console.log('✅ Email enviado via SendGrid para:', data.to);
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);
      
      // Se falhar, usar log como fallback
      if (error.response) {
        console.error('❌ Detalhes do erro SendGrid:', error.response.body);
      }
      
      console.log('⚠️ Usando log como fallback.');
      console.log('📧 EMAIL (fallback):');
      console.log('Para:', data.to);
      console.log('Assunto:', data.subject);
      
      // Não lançar erro - emails não devem bloquear outras operações
    }
  }

  /**
   * Verifica se SendGrid está configurado
   */
  static isSendGridConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  /**
   * Template de confirmação de registro
   */
  static async sendRegistrationConfirmation(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Bem-vindo à Primeira Troca!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #38bdf8, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Primeira Troca</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0ea5e9;">Bem-vindo, ${name}!</h2>
            <p>Obrigado por se cadastrar na Primeira Troca!</p>
            <p>Sua conta foi criada com sucesso. Agora você pode:</p>
            <ul>
              <li>Fazer compras em nossa loja</li>
              <li>Acompanhar seus pedidos</li>
              <li>Receber ofertas exclusivas</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/shop" 
                 style="background: linear-gradient(to right, #fbbf24, #f97316); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Explorar Loja
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Se você não criou esta conta, pode ignorar este email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Primeira Troca. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Bem-vindo à Primeira Troca!',
      html,
    });
  }

  /**
   * Template de confirmação de pedido
   */
  static async sendOrderConfirmation(email: string, name: string, orderId: number, orderTotal: number): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Pedido #${orderId} Confirmado</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #38bdf8, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Primeira Troca</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0ea5e9;">Pedido Confirmado!</h2>
            <p>Olá, ${name}!</p>
            <p>Seu pedido <strong>#${orderId}</strong> foi confirmado com sucesso.</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Número do Pedido:</strong> #${orderId}</p>
              <p style="margin: 10px 0 0 0;"><strong>Total:</strong> R$ ${orderTotal.toFixed(2)}</p>
            </div>
            <p>Você receberá um email quando o pedido for enviado.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" 
                 style="background: linear-gradient(to right, #fbbf24, #f97316); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Acompanhar Pedido
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Obrigado pela sua compra!
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Primeira Troca. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Pedido #${orderId} Confirmado`,
      html,
    });
  }

  /**
   * Template de atualização de status do pedido
   */
  static async sendOrderStatusUpdate(email: string, name: string, orderId: number, oldStatus: string, newStatus: string): Promise<void> {
    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Em Processamento',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };

    const statusColors: Record<string, string> = {
      pending: '#fbbf24',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Status do Pedido #${orderId} Atualizado</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #38bdf8, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Primeira Troca</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0ea5e9;">Atualização do Pedido</h2>
            <p>Olá, ${name}!</p>
            <p>O status do seu pedido <strong>#${orderId}</strong> foi atualizado:</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">Status Anterior</p>
              <p style="margin: 5px 0; font-size: 18px; color: #999;">${statusLabels[oldStatus] || oldStatus}</p>
              <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">Novo Status</p>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: ${statusColors[newStatus] || '#0ea5e9'};">
                ${statusLabels[newStatus] || newStatus}
              </p>
            </div>
            ${newStatus === 'shipped' ? '<p><strong>Seu pedido foi enviado!</strong> Você receberá em breve.</p>' : ''}
            ${newStatus === 'delivered' ? '<p><strong>Seu pedido foi entregue!</strong> Esperamos que você tenha gostado!</p>' : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" 
                 style="background: linear-gradient(to right, #fbbf24, #f97316); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Ver Pedido
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Primeira Troca. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Status do Pedido #${orderId} Atualizado`,
      html,
    });
  }

  /**
   * Template de recuperação de senha
   */
  static async sendPasswordReset(email: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Recuperação de Senha</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #38bdf8, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Primeira Troca</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0ea5e9;">Recuperação de Senha</h2>
            <p>Olá, ${name}!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(to right, #fbbf24, #f97316); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${resetUrl}" style="color: #0ea5e9; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
              <strong>⚠️ Atenção:</strong> Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Primeira Troca. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Recuperação de Senha - Primeira Troca',
      html,
    });
  }
}

