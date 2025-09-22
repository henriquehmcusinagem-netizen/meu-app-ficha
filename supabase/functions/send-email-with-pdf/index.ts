import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import jsPDF from "https://esm.sh/jspdf@2.5.1";
import "https://esm.sh/jspdf-autotable@3.7.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  ficha: any;
  to: string;
  subject?: string;
}

// Simplified PDF generation for Edge Function (reusing core logic)
function generatePDFBuffer(ficha: any): Uint8Array {
  const doc = new (jsPDF as any)('portrait', 'mm', 'a4');
  
  // Basic styling
  const primaryColor = [59, 130, 246]; // Blue
  const textColor = [0, 0, 0]; // Black
  const mutedColor = [107, 114, 128]; // Gray
  
  let yPosition = 20;
  
  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FICHA TÉCNICA COMERCIAL', 105, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // FTC Number and Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`FTC Nº: ${ficha.numeroFTC}`, 20, yPosition);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 140, yPosition);
  
  yPosition += 15;
  
  // Client Data
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('DADOS DO CLIENTE:', 20, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Cliente: ${ficha.formData.nomeCliente || 'N/A'}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Contato: ${ficha.formData.contatoCliente || 'N/A'}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Telefone: ${ficha.formData.telefoneCliente || 'N/A'}`, 20, yPosition);
  
  yPosition += 15;
  
  // Equipment Data
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('DADOS DA PEÇA/EQUIPAMENTO:', 20, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Descrição: ${ficha.formData.descricaoPeca || 'N/A'}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Material: ${ficha.formData.materialPeca || 'N/A'}`, 20, yPosition);
  
  yPosition += 15;
  
  // Summary
  if (ficha.calculos) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('RESUMO:', 20, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Total Geral: R$ ${ficha.calculos.totalGeral?.toFixed(2) || '0,00'}`, 20, yPosition);
  }
  
  return doc.output('arraybuffer');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ficha, to, subject }: EmailRequest = await req.json();
    
    console.log("Generating PDF for ficha:", ficha.numeroFTC);
    
    // Generate PDF
    const pdfBuffer = generatePDFBuffer(ficha);
    
    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Ficha Técnica <onboarding@resend.dev>",
      to: [to],
      subject: subject || `Ficha Técnica - ${ficha.numeroFTC}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Ficha Técnica Comercial</h2>
          <p>Prezado(a),</p>
          <p>Segue em anexo a Ficha Técnica Comercial <strong>${ficha.numeroFTC}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Resumo da Ficha:</h3>
            <p><strong>Cliente:</strong> ${ficha.formData.nomeCliente || 'N/A'}</p>
            <p><strong>Contato:</strong> ${ficha.formData.contatoCliente || 'N/A'}</p>
            <p><strong>Descrição:</strong> ${ficha.formData.descricaoPeca || 'N/A'}</p>
            ${ficha.calculos ? `<p><strong>Total:</strong> R$ ${ficha.calculos.totalGeral?.toFixed(2) || '0,00'}</p>` : ''}
          </div>
          
          <p>Atenciosamente,<br>Equipe Técnica</p>
        </div>
      `,
      attachments: [
        {
          filename: `ficha-tecnica-${ficha.numeroFTC}.pdf`,
          content: Array.from(new Uint8Array(pdfBuffer)),
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-with-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);