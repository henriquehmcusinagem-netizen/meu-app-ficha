import { FichaSalva } from '@/types/ficha-tecnica';
import { generateHTMLContent } from './htmlGenerator';

export function openHTMLInNewTab(ficha: FichaSalva) {
  try {
    const htmlContent = generateHTMLContent(ficha);
    
    // Create complete HTML document with enhanced styles and actions
    const fullHTMLDocument = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha Técnica - ${ficha.resumo.cliente} - FTC ${ficha.numeroFTC}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 800px; 
            margin: 20px auto; 
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .header-actions {
            background: #1e40af;
            color: white;
            padding: 15px 20px;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        .btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
        }
        .content { 
            padding: 20px;
        }
        @media print {
            .header-actions { display: none; }
            .container { 
                box-shadow: none; 
                margin: 0;
                border-radius: 0;
            }
            body { background: white; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-actions">
            <h2 style="margin: 0 0 10px 0;">Ficha Técnica de Cotação</h2>
            <div class="action-buttons">
                <button class="btn" onclick="window.print()">
                    🖨️ Imprimir
                </button>
                <button class="btn" onclick="saveAsHTML()">
                    💾 Salvar HTML
                </button>
                <button class="btn" onclick="copyContent()">
                    📋 Copiar Conteúdo
                </button>
                <button class="btn" onclick="shareEmail()">
                    📧 Compartilhar Email
                </button>
                <button class="btn" onclick="window.close()">
                    ❌ Fechar
                </button>
            </div>
        </div>
        <div class="content">
            ${htmlContent}
        </div>
    </div>

    <script>
        function saveAsHTML() {
            const content = document.documentElement.outerHTML;
            const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'FTC_${ficha.numeroFTC}_${ficha.resumo.cliente.replace(/[^a-zA-Z0-9]/g, '_')}.html';
            link.click();
        }
        
        function copyContent() {
            const content = document.querySelector('.content').innerText;
            navigator.clipboard.writeText(content).then(() => {
                alert('Conteúdo copiado para a área de transferência!');
            }).catch(() => {
                // Fallback para navegadores mais antigos
                const textArea = document.createElement('textarea');
                textArea.value = content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Conteúdo copiado para a área de transferência!');
            });
        }
        
        function shareEmail() {
            const subject = encodeURIComponent('Ficha Técnica de Cotação - ${ficha.resumo.cliente} - FTC ${ficha.numeroFTC}');
            const body = encodeURIComponent(document.querySelector('.content').innerText);
            const email = '${ficha.formData.fone_email || ''}';
            const mailtoLink = \`mailto:\${email}?subject=\${subject}&body=\${body}\`;
            window.open(mailtoLink);
        }
    </script>
</body>
</html>`;
    
    // Open in new tab
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(fullHTMLDocument);
      newTab.document.close();
    } else {
      throw new Error('Popup foi bloqueado pelo navegador');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao abrir HTML:', error);
    return false;
  }
}