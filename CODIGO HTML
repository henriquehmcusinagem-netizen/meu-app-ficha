<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha Técnica de Cotação - FTC</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.3;
            background-color: #f0f2f5;
            padding: 10px;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .header-info {
            text-align: left;
        }

        .header-info .data {
            font-size: 14px;
            color: #666;
        }

        .header-info .ftc-number {
            font-size: 16px;
            font-weight: bold;
            color: #007bff;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
        }

        .header-spacer {
            width: 150px;
        }

        .form-section {
            margin-bottom: 15px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }

        .form-section h3 {
            margin-bottom: 15px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }

        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 12px;
            align-items: end;
        }

        .form-row-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 12px;
            align-items: end;
        }

        .form-row-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 12px;
            align-items: end;
        }

        .form-row-4 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 12px;
            align-items: end;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group-full {
            grid-column: 1 / -1;
        }

        .cliente-selection {
            display: flex;
            gap: 5px;
            align-items: end;
        }

        .cliente-selection select {
            flex: 1;
        }

        .cliente-selection input {
            flex: 2;
        }

        label {
            font-weight: bold;
            margin-bottom: 3px;
            color: #333;
            font-size: 12px;
        }

        input[type="text"], input[type="date"], input[type="number"], select, textarea {
            padding: 6px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 13px;
            width: 100%;
        }

        input[type="text"]:focus, input[type="date"]:focus, input[type="number"]:focus, select:focus, textarea:focus {
            border-color: #007bff;
            outline: none;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .readonly-field {
            background-color: #e9ecef !important;
            border: 2px solid #6c757d !important;
            font-weight: bold !important;
        }

        .material-item {
            display: grid;
            grid-template-columns: 2fr 80px 100px 120px 120px auto;
            gap: 8px;
            align-items: end;
            margin-bottom: 8px;
            padding: 8px;
            background-color: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        }

        .voice-btn {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            border: none;
            border-radius: 6px;
            width: 32px;
            height: 32px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 3px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: relative;
        }

        .voice-btn:hover {
            background: linear-gradient(135deg, #c82333, #bd2130);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .voice-btn:active {
            transform: translateY(0);
        }

        .voice-btn.recording {
            background: linear-gradient(135deg, #ff0000, #cc0000);
            animation: pulse 0.8s infinite;
            box-shadow: 0 0 15px rgba(255,0,0,0.5);
        }

        .voice-btn.error {
            background: linear-gradient(135deg, #6c757d, #5a6268);
            cursor: not-allowed;
        }

        .voice-btn::before {
            content: "🎤";
            font-size: 12px;
        }

        .voice-btn.recording::before {
            content: "⏺️";
        }

        .voice-btn.error::before {
            content: "❌";
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .action-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-primary {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
        }

        .btn-success {
            background: linear-gradient(135deg, #28a745, #1e7e34);
            color: white;
        }

        .btn-warning {
            background: linear-gradient(135deg, #ffc107, #e0a800);
            color: black;
        }

        .btn-add {
            background: linear-gradient(135deg, #17a2b8, #138496);
            color: white;
            margin-top: 10px;
            touch-action: manipulation;
        }

        .btn-whatsapp {
            background: linear-gradient(135deg, #25d366, #1da851);
            color: white;
        }

        .btn-email {
            background: linear-gradient(135deg, #0078d4, #106ebe);
            color: white;
        }

        .totals-section {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
            border: 2px solid #2196f3;
        }

        .total-display {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            font-size: 14px;
            font-weight: bold;
            color: #1565c0;
        }

        .total-item {
            background: white;
            padding: 8px;
            border-radius: 4px;
            text-align: center;
            border: 1px solid #2196f3;
        }

        .input-with-voice {
            display: flex;
            align-items: end;
            gap: 3px;
        }

        .checkbox-group {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 3px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
        }

        .checkbox-item input[type="radio"], 
        .checkbox-item input[type="checkbox"] {
            width: auto;
            margin-right: 3px;
        }

        .permission-notice {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            text-align: center;
            font-size: 12px;
        }

        .permission-notice.hidden {
            display: none;
        }

        .foto-preview {
            position: relative;
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: #f8f9fa;
        }

        .foto-preview img {
            width: 100%;
            height: 100px;
            object-fit: cover;
            display: block;
        }

        .foto-preview .remove-foto {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(220, 53, 69, 0.9);
            color: white;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .foto-preview .remove-foto:hover {
            background: rgba(220, 53, 69, 1);
        }

        .foto-preview .foto-nome {
            padding: 5px;
            font-size: 10px;
            text-align: center;
            color: #666;
            background: rgba(255,255,255,0.9);
            border-top: 1px solid #ddd;
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
            .container {
                padding: 10px;
                margin: 5px;
            }

            .header-top {
                flex-direction: column;
                text-align: center;
            }

            .header h1 {
                font-size: 18px;
                margin: 10px 0;
            }

            .cliente-selection {
                flex-direction: column;
                gap: 5px;
            }

            .cliente-selection select,
            .cliente-selection input {
                flex: none;
            }
            
            .form-row,
            .form-row-2,
            .form-row-3,
            .form-row-4 {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .material-item {
                grid-template-columns: 1fr;
                gap: 8px;
                padding: 12px;
            }
            
            .checkbox-group {
                gap: 10px;
            }
            
            .action-buttons {
                flex-direction: column;
                align-items: stretch;
            }

            .btn {
                padding: 12px;
                font-size: 16px;
                touch-action: manipulation;
            }

            .voice-btn {
                width: 40px;
                height: 40px;
                font-size: 16px;
            }

            .total-display {
                grid-template-columns: 1fr;
            }

            .foto-preview img {
                height: 80px;
            }

            #fotos-preview {
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
            }
        }

        /* Desktop optimizations */
        @media (min-width: 1200px) {
            .container {
                max-width: 95%;
                padding: 30px;
            }

            .form-row-4 {
                grid-template-columns: 1fr 1fr 1fr 1fr;
            }

            .form-row-3 {
                grid-template-columns: 1fr 1fr 1fr;
            }

            .material-item {
                grid-template-columns: 3fr 100px 120px 150px 150px auto;
            }
        }

        /* IMPRESSÃO OTIMIZADA PARA UMA FOLHA */
        @media print {
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                background: white;
                padding: 0;
                font-size: 10px !important;
                line-height: 1.1;
            }
            
            .container {
                max-width: 100%;
                padding: 8px;
                margin: 0;
                box-shadow: none;
                background: white;
            }

            .header {
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 1px solid #000;
            }

            .header-top {
                flex-direction: row;
                justify-content: space-between;
                margin-bottom: 3px;
            }

            .header h1 {
                font-size: 12px !important;
                text-align: center;
                margin: 0;
            }

            .header-info {
                font-size: 8px;
            }
            
            .action-buttons, .voice-btn, .permission-notice, .btn-add, .remove-foto {
                display: none !important;
            }

            .form-section {
                margin-bottom: 6px;
                padding: 4px;
                border: 1px solid #333;
                border-radius: 0;
                page-break-inside: avoid;
            }

            .form-section h3 {
                font-size: 9px;
                font-weight: bold;
                margin-bottom: 3px;
                text-align: center;
                background: #f0f0f0;
                padding: 1px;
                border: 1px solid #333;
            }

            .form-row,
            .form-row-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
                margin-bottom: 2px;
                align-items: center;
            }

            .form-row-3 {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 3px;
                margin-bottom: 2px;
            }

            .form-row-4 {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                gap: 2px;
                margin-bottom: 2px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                margin-bottom: 1px;
            }

            .form-group-full {
                grid-column: 1 / -1;
            }

            label {
                font-size: 7px;
                font-weight: bold;
                margin-bottom: 1px;
                color: #000;
            }
            
            input, select, textarea {
                border: none;
                border-bottom: 1px solid #000;
                background: transparent;
                padding: 1px;
                font-size: 8px;
                min-height: 10px;
                width: 100%;
            }

            textarea {
                min-height: 15px;
                resize: none;
            }

            .cliente-selection {
                display: block;
            }

            .cliente-selection select {
                display: none !important;
            }

            .material-item {
                display: grid;
                grid-template-columns: 2fr 30px 50px 60px 60px;
                gap: 2px;
                margin-bottom: 1px;
                padding: 1px;
                border: 1px solid #ccc;
                font-size: 7px;
            }

            .material-item label {
                font-size: 6px;
            }

            .material-item input {
                font-size: 7px;
                min-height: 8px;
            }

            .checkbox-group {
                display: flex;
                gap: 3px;
                flex-wrap: wrap;
                font-size: 7px;
            }

            .checkbox-item {
                display: flex;
                align-items: center;
                gap: 1px;
                font-size: 7px;
            }

            .checkbox-item input[type="radio"], 
            .checkbox-item input[type="checkbox"] {
                width: 8px;
                height: 8px;
                margin-right: 1px;
            }

            .checkbox-item label {
                font-size: 7px;
                margin: 0;
            }

            .totals-section {
                background: #f0f0f0;
                padding: 3px;
                border: 2px solid #000;
                border-radius: 0;
                margin-top: 4px;
                page-break-inside: avoid;
            }

            .totals-section h3 {
                font-size: 9px;
                text-align: center;
                margin-bottom: 3px;
            }

            .total-display {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                gap: 2px;
                font-size: 7px;
            }

            .total-item {
                background: white;
                padding: 2px;
                border: 1px solid #000;
                text-align: center;
                font-size: 7px;
            }

            #fotos-preview {
                display: none !important;
            }

            .foto-preview {
                display: none !important;
            }

            .input-with-voice .voice-btn {
                display: none !important;
            }

            /* Ajustar altura da página */
            @page {
                size: A4;
                margin: 0.4cm;
            }

            /* Compactar ainda mais algumas seções específicas */
            .form-section:nth-child(n+6) {
                margin-bottom: 3px;
                padding: 2px;
            }

            /* Forçar quebra em menos colunas para economizar espaço vertical */
            .form-section:has(h3:contains("TRATAMENTOS")) .form-row-4 {
                grid-template-columns: 1fr 1fr;
                gap: 1px;
            }

            .form-section:has(h3:contains("HORAS")) .form-row-4 {
                grid-template-columns: 1fr 1fr 1fr;
                gap: 1px;
            }

            .form-section:has(h3:contains("EXECUÇÃO")) .form-row-3 {
                grid-template-columns: 1fr 1fr;
                gap: 2px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="permission-notice" id="permissionNotice">
            <strong>🎤 Permissão de Microfone:</strong> Clique em "Permitir" quando o navegador solicitar para usar o reconhecimento de voz. 
            <button onclick="requestMicrophonePermission()" style="margin-left: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">Ativar Microfone</button>
        </div>

        <div class="header">
            <div class="header-top">
                <div class="header-info">
                    <div class="data">Data: <span id="data-atual"></span></div>
                    <div class="ftc-number">Nº FTC: <span id="numero-ftc"></span></div>
                </div>
                <h1>FICHA TÉCNICA DE COTAÇÃO - FTC</h1>
                <div class="header-spacer"></div>
            </div>
        </div>

        <form id="fichaForm">
            <!-- Dados do Cliente -->
            <div class="form-section">
                <h3>DADOS DO CLIENTE</h3>
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="cliente">CLIENTE:</label>
                        <div class="cliente-selection">
                            <select id="cliente-select" onchange="selecionarCliente()">
                                <option value="">🖊️ Digitar manualmente</option>
                                <option value="BTP">BTP</option>
                                <option value="TEG">TEG</option>
                                <option value="TEAG">TEAG</option>
                                <option value="TES">TES</option>
                                <option value="DPWORLD">DPWORLD</option>
                                <option value="ECOPORTO">ECOPORTO</option>
                                <option value="T39">T39</option>
                                <option value="SANTOS BRASIL">SANTOS BRASIL</option>
                                <option value="MILLS">MILLS</option>
                                <option value="ADM">ADM</option>
                                <option value="CLI - RUMO">CLI - RUMO</option>
                                <option value="TGG">TGG</option>
                                <option value="CMOC">CMOC</option>
                                <option value="T12A">T12A</option>
                                <option value="ULTRAFERTIL">ULTRAFERTIL</option>
                                <option value="RIO BRASIL SEPETIBA">RIO BRASIL SEPETIBA</option>
                                <option value="TERLOC">TERLOC</option>
                                <option value="INOVE">INOVE</option>
                                <option value="XCMG">XCMG</option>
                                <option value="COPERSUCAR">COPERSUCAR</option>
                                <option value="TERRACOM">TERRACOM</option>
                                <option value="TGRAO">TGRAO</option>
                                <option value="PORÃ">PORÃ</option>
                                <option value="CUTRALE">CUTRALE</option>
                                <option value="CONSUMIDOR">CONSUMIDOR</option>
                                <option value="STERN">STERN</option>
                                <option value="COIMBRA - USIT">COIMBRA - USIT</option>
                                <option value="MARIMEX">MARIMEX</option>
                                <option value="KEPLER">KEPLER</option>
                                <option value="ELDORADO">ELDORADO</option>
                            </select>
                            <input type="text" id="cliente" name="cliente" required placeholder="Digite o nome do cliente">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('cliente')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="solicitante">SOLICITANTE:</label>
                        <div class="input-with-voice">
                            <input type="text" id="solicitante" name="solicitante">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('solicitante')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                </div>
                
                <div class="form-row-3">
                    <div class="form-group">
                        <label for="fone_email">FONE/EMAIL:</label>
                        <div class="input-with-voice">
                            <input type="text" id="fone_email" name="fone_email">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('fone_email')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="data_visita">DATA DA VISITA:</label>
                        <input type="date" id="data_visita" name="data_visita">
                    </div>
                    <div class="form-group">
                        <label for="data_entrega">ENTREGAR PEÇA OU SERVIÇO NO DIA:</label>
                        <input type="date" id="data_entrega" name="data_entrega" required style="border: 2px solid #007bff;">
                    </div>
                </div>
            </div>

            <!-- Dados da Peça -->
            <div class="form-section">
                <h3>DADOS DA PEÇA/EQUIPAMENTO</h3>
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="nome_peca">NOME DA PEÇA / EQUIPAMENTO:</label>
                        <div class="input-with-voice">
                            <textarea id="nome_peca" name="nome_peca" rows="2"></textarea>
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('nome_peca')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="quantidade">QUANTIDADE:</label>
                        <input type="number" id="quantidade" name="quantidade" min="1" value="1" onchange="updateCalculations()">
                    </div>
                </div>

                <div class="form-group-full">
                    <label for="servico">SERVIÇO A SER REALIZADO:</label>
                    <div class="input-with-voice">
                        <textarea id="servico" name="servico" rows="3"></textarea>
                        <button type="button" class="voice-btn" onclick="startVoiceRecognition('servico')" title="Reconhecimento de Voz"></button>
                    </div>
                </div>

                <div class="form-group-full">
                    <label for="fotos_pecas">FOTOS DAS PEÇAS:</label>
                    <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px; flex-wrap: wrap;">
                        <input type="file" id="fotos_pecas" name="fotos_pecas" accept="image/*" multiple onchange="handleFileUpload(this)" style="display: none;">
                        <button type="button" onclick="document.getElementById('fotos_pecas').click()" class="btn btn-add" style="margin: 0;">📷 Adicionar Fotos</button>
                        <span id="fotos-count" style="color: #666; font-size: 12px;">Nenhuma foto selecionada</span>
                        <span style="color: #999; font-size: 11px; margin-left: 10px;">Máx. 10 fotos, 5MB cada</span>
                    </div>
                    <div id="fotos-preview" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 10px;">
                        <!-- Preview das fotos aparecerá aqui -->
                    </div>
                </div>
            </div>

            <!-- Materiais para Cotação -->
            <div class="form-section">
                <h3>MATERIAL PARA COTAÇÃO</h3>
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="material_por_peca">VALOR POR PEÇA (Calculado):</label>
                        <input type="number" id="material_por_peca" name="material_por_peca" step="0.01" readonly class="readonly-field">
                    </div>
                    <div class="form-group">
                        <label for="material_todas_pecas">VALOR TODAS AS PEÇAS (Calculado):</label>
                        <input type="number" id="material_todas_pecas" name="material_todas_pecas" step="0.01" readonly class="readonly-field">
                    </div>
                </div>

                <div id="materiais-container">
                    <!-- Materiais serão adicionados dinamicamente -->
                </div>
                <button type="button" onclick="addMaterial()" class="btn btn-add">➕ Adicionar Material</button>
            </div>

            <!-- Execução e Detalhes -->
            <div class="form-section">
                <h3>EXECUÇÃO E DETALHES</h3>
                <div class="form-row-3">
                    <div class="form-group">
                        <label>SERÁ EXECUTADO EM:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="exec_hmc" name="execucao" value="HMC">
                                <label for="exec_hmc">HMC</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="exec_cliente" name="execucao" value="CLIENTE">
                                <label for="exec_cliente">CLIENTE</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>VISITA TÉCNICA:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="visita_sim" name="visita_tecnica" value="SIM">
                                <label for="visita_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="visita_nao" name="visita_tecnica" value="NAO">
                                <label for="visita_nao">NÃO</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="visita_horas">HORAS VISITA:</label>
                        <input type="number" id="visita_horas" name="visita_horas" step="0.5">
                    </div>
                </div>

                <div class="form-row-3">
                    <div class="form-group">
                        <label>TEM PEÇA DE AMOSTRA:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="amostra_sim" name="peca_amostra" value="SIM">
                                <label for="amostra_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="amostra_nao" name="peca_amostra" value="NAO">
                                <label for="amostra_nao">NÃO</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>PROJETO DESENVOLVIDO POR:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="projeto_hmc" name="projeto_desenvolvido" value="HMC">
                                <label for="projeto_hmc">HMC</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="projeto_cliente" name="projeto_desenvolvido" value="CLIENTE">
                                <label for="projeto_cliente">CLIENTE</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="projeto_hmc_cliente" name="projeto_desenvolvido" value="HMC/CLIENTE">
                                <label for="projeto_hmc_cliente">HMC/CLIENTE</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>DESENHO DA PEÇA:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="desenho_hmc" name="desenho_peca" value="HMC">
                                <label for="desenho_hmc">HMC</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="desenho_cliente" name="desenho_peca" value="CLIENTE">
                                <label for="desenho_cliente">CLIENTE</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="desenho_finalizado" name="desenho_finalizado">
                                <label for="desenho_finalizado">FINALIZADO</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>TRANSPORTE COLETA / ENTREGA:</label>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="transp_caminhao_hmc" name="transporte_caminhao_hmc">
                            <label for="transp_caminhao_hmc">CAMINHÃO HMC</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="transp_pickup_hmc" name="transporte_pickup_hmc">
                            <label for="transp_pickup_hmc">PICKUP HMC</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="transp_cliente" name="transporte_cliente">
                            <label for="transp_cliente">CLIENTE</label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tratamentos e Acabamentos -->
            <div class="form-section">
                <h3>TRATAMENTOS E ACABAMENTOS</h3>
                
                <div class="form-row-4">
                    <div class="form-group">
                        <label>PINTURA:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="pintura_sim" name="pintura" value="SIM">
                                <label for="pintura_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="pintura_nao" name="pintura" value="NAO">
                                <label for="pintura_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="cor_pintura">COR:</label>
                        <div class="input-with-voice">
                            <input type="text" id="cor_pintura" name="cor_pintura">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('cor_pintura')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>GALVANIZAÇÃO:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="galv_sim" name="galvanizacao" value="SIM">
                                <label for="galv_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="galv_nao" name="galvanizacao" value="NAO">
                                <label for="galv_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="peso_peca_galv">PESO PÇ (Galv):</label>
                        <input type="number" id="peso_peca_galv" name="peso_peca_galv" step="0.1">
                    </div>
                </div>

                <div class="form-row-4">
                    <div class="form-group">
                        <label>TRATAMENTO TÉRMICO:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="trat_term_sim" name="tratamento_termico" value="SIM">
                                <label for="trat_term_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="trat_term_nao" name="tratamento_termico" value="NAO">
                                <label for="trat_term_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="peso_peca_trat">PESO PÇ (Trat):</label>
                        <input type="number" id="peso_peca_trat" name="peso_peca_trat" step="0.1">
                    </div>
                    <div class="form-group">
                        <label for="tempera_reven">TEMPERA / REVEN:</label>
                        <div class="input-with-voice">
                            <input type="text" id="tempera_reven" name="tempera_reven">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('tempera_reven')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="cementacao">CEMENTAÇÃO:</label>
                        <div class="input-with-voice">
                            <input type="text" id="cementacao" name="cementacao">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('cementacao')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                </div>

                <div class="form-row-4">
                    <div class="form-group">
                        <label for="dureza">DUREZA:</label>
                        <div class="input-with-voice">
                            <input type="text" id="dureza" name="dureza">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('dureza')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>TESTE DE LP:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="teste_lp_sim" name="teste_lp" value="SIM">
                                <label for="teste_lp_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="teste_lp_nao" name="teste_lp" value="NAO">
                                <label for="teste_lp_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="balanceamento_campo">BALANCEAMENTO:</label>
                        <div class="input-with-voice">
                            <input type="text" id="balanceamento_campo" name="balanceamento_campo">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('balanceamento_campo')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="rotacao">ROTAÇÃO:</label>
                        <div class="input-with-voice">
                            <input type="text" id="rotacao" name="rotacao">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('rotacao')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                </div>

                <div class="form-row-4">
                    <div class="form-group">
                        <label>FORNECIMENTO DE DESENHO:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="forn_desenho_sim" name="fornecimento_desenho" value="SIM">
                                <label for="forn_desenho_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="forn_desenho_nao" name="fornecimento_desenho" value="NAO">
                                <label for="forn_desenho_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>FOTOS PARA RELATÓRIO:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="fotos_sim" name="fotos_relatorio" value="SIM">
                                <label for="fotos_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="fotos_nao" name="fotos_relatorio" value="NAO">
                                <label for="fotos_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>RELATÓRIO TÉCNICO:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="relatorio_sim" name="relatorio_tecnico" value="SIM">
                                <label for="relatorio_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="relatorio_nao" name="relatorio_tecnico" value="NAO">
                                <label for="relatorio_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>EMISSÃO DE ART:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="radio" id="art_sim" name="emissao_art" value="SIM">
                                <label for="art_sim">SIM</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="radio" id="art_nao" name="emissao_art" value="NAO">
                                <label for="art_nao">NÃO</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="servicos_terceirizados">SERVIÇOS TERCEIRIZADOS:</label>
                    <div class="input-with-voice">
                        <textarea id="servicos_terceirizados" name="servicos_terceirizados" rows="2"></textarea>
                        <button type="button" class="voice-btn" onclick="startVoiceRecognition('servicos_terceirizados')" title="Reconhecimento de Voz"></button>
                    </div>
                </div>
            </div>

            <!-- Horas de Serviço -->
            <div class="form-section">
                <h3>PRÉVIA DE HORAS PARA REALIZAR O SERVIÇO / PEÇA</h3>
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="horas_por_peca">HORAS POR PEÇA (Calculado):</label>
                        <input type="number" id="horas_por_peca" name="horas_por_peca" step="0.5" readonly class="readonly-field">
                    </div>
                    <div class="form-group">
                        <label for="horas_todas_pecas">HORAS TODAS AS PEÇAS (Calculado):</label>
                        <input type="number" id="horas_todas_pecas" name="horas_todas_pecas" step="0.5" readonly class="readonly-field">
                    </div>
                </div>

                <div class="form-row-4">
                    <div class="form-group">
                        <label for="torno_grande">TORNO GRANDE:</label>
                        <input type="number" id="torno_grande" name="torno_grande" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="torno_pequeno">TORNO PEQUENO:</label>
                        <input type="number" id="torno_pequeno" name="torno_pequeno" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="cnc_tf">CNC T/F:</label>
                        <input type="number" id="cnc_tf" name="cnc_tf" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="fresa_furad">FRESA/FURAD:</label>
                        <input type="number" id="fresa_furad" name="fresa_furad" step="0.5" onchange="updateCalculations()">
                    </div>
                </div>

                <div class="form-row-4">
                    <div class="form-group">
                        <label for="plasma_oxicorte">PLASMA/OXICORTE:</label>
                        <input type="number" id="plasma_oxicorte" name="plasma_oxicorte" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="dobra">DOBRA:</label>
                        <input type="number" id="dobra" name="dobra" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="calandra">CALANDRA:</label>
                        <input type="number" id="calandra" name="calandra" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="macarico_solda">MAÇARICO/SOLDA:</label>
                        <input type="number" id="macarico_solda" name="macarico_solda" step="0.5" onchange="updateCalculations()">
                    </div>
                </div>

                <div class="form-row-4">
                    <div class="form-group">
                        <label for="des_montg">DES/MONTG:</label>
                        <input type="number" id="des_montg" name="des_montg" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="balanceamento">BALANCEAMENTO:</label>
                        <input type="number" id="balanceamento" name="balanceamento" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="mandrilhamento">MANDRILHAMENTO CAMPO:</label>
                        <input type="number" id="mandrilhamento" name="mandrilhamento" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="tratamento">TRATAMENTO:</label>
                        <input type="number" id="tratamento" name="tratamento" step="0.5" onchange="updateCalculations()">
                    </div>
                </div>

                <div class="form-row-4">
                    <div class="form-group">
                        <label for="pintura_horas">PINTURA:</label>
                        <input type="number" id="pintura_horas" name="pintura_horas" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="lavagem_acab">LAVAGEM/ACAB:</label>
                        <input type="number" id="lavagem_acab" name="lavagem_acab" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="programacao_cam">PROGRAMAÇÃO CAM:</label>
                        <input type="number" id="programacao_cam" name="programacao_cam" step="0.5" onchange="updateCalculations()">
                    </div>
                    <div class="form-group">
                        <label for="eng_tec">ENG / TEC:</label>
                        <input type="number" id="eng_tec" name="eng_tec" step="0.5" onchange="updateCalculations()">
                    </div>
                </div>
            </div>

            <!-- Números de Controle -->
            <div class="form-section">
                <h3>CONTROLE</h3>
                <div class="form-row-3">
                    <div class="form-group">
                        <label for="num_orcamento">Nº do orçamento:</label>
                        <div class="input-with-voice">
                            <input type="text" id="num_orcamento" name="num_orcamento">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('num_orcamento')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="num_os">Nº da O.S:</label>
                        <div class="input-with-voice">
                            <input type="text" id="num_os" name="num_os" placeholder="Número da Ordem de Serviço" style="border: 2px solid #28a745; background-color: #f0fff0;">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('num_os')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="num_nf_remessa">Nº da NF DE REMESSA DO CLIENTE:</label>
                        <div class="input-with-voice">
                            <input type="text" id="num_nf_remessa" name="num_nf_remessa">
                            <button type="button" class="voice-btn" onclick="startVoiceRecognition('num_nf_remessa')" title="Reconhecimento de Voz"></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Totais -->
            <div class="totals-section">
                <h3 style="text-align: center; margin-bottom: 15px;">RESUMO DOS TOTAIS</h3>
                <div class="total-display">
                    <div class="total-item">HORAS POR PEÇA<br><span id="total-horas-peca">0.0</span> h</div>
                    <div class="total-item">HORAS TODAS AS PEÇAS<br><span id="total-horas-todas">0.0</span> h</div>
                    <div class="total-item">MATERIAL POR PEÇA<br>R$ <span id="total-material-peca">0.00</span></div>
                    <div class="total-item">MATERIAL TODAS AS PEÇAS<br>R$ <span id="total-material-todas">0.00</span></div>
                </div>
            </div>
        </form>

        <div class="action-buttons">
            <button type="button" class="btn btn-primary" onclick="exportToPDF()">📄 Exportar PDF</button>
            <button type="button" class="btn btn-success" onclick="exportToHTML()">📁 Exportar HTML</button>
            <button type="button" class="btn btn-warning" onclick="window.print()">🖨️ Imprimir</button>
            <button type="button" class="btn btn-whatsapp" onclick="enviarWhatsApp()">📱 Enviar WhatsApp</button>
            <button type="button" class="btn btn-email" onclick="enviarEmail()">📧 Enviar Email</button>
        </div>
    </div>

    <script>
        let materialCount = 0;
        let recognition;
        let microphonePermission = false;
        let fotosUploaded = [];
        let numeroFTC = 0;

        // Inicializar
        window.onload = function() {
            gerarNumeroFTC();
            mostrarDataAtual();
            addMaterial();
            updateCalculations();
            checkMicrophoneSupport();
        };

        // Gerar número FTC automático
        function gerarNumeroFTC() {
            let ultimoNumero = localStorage.getItem('ultimoNumeroFTC');
            if (!ultimoNumero) {
                ultimoNumero = 99;
            }
            
            numeroFTC = parseInt(ultimoNumero) + 1;
            const ano = new Date().getFullYear();
            const numeroCompleto = `FTC-${ano}-${numeroFTC.toString().padStart(3, '0')}`;
            
            document.getElementById('numero-ftc').textContent = numeroCompleto;
            localStorage.setItem('ultimoNumeroFTC', numeroFTC);
        }

        // Mostrar data atual
        function mostrarDataAtual() {
            const hoje = new Date();
            const dataFormatada = hoje.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('data-atual').textContent = dataFormatada;
        }

        // Selecionar cliente da lista
        function selecionarCliente() {
            const select = document.getElementById('cliente-select');
            const input = document.getElementById('cliente');
            
            if (select.value === "") {
                input.value = "";
                input.focus();
            } else {
                input.value = select.value;
            }
        }

        // Verificar suporte ao microfone
        function checkMicrophoneSupport() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                const voiceBtns = document.querySelectorAll('.voice-btn');
                voiceBtns.forEach(btn => {
                    btn.classList.add('error');
                    btn.title = 'Reconhecimento de voz não suportado neste navegador';
                    btn.onclick = () => alert('Reconhecimento de voz não é suportado neste navegador');
                });
                document.getElementById('permissionNotice').innerHTML = 
                    '<strong>❌ Reconhecimento de voz não é suportado neste navegador</strong>';
            }
        }

        // Solicitar permissão do microfone
        async function requestMicrophonePermission() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                microphonePermission = true;
                document.getElementById('permissionNotice').classList.add('hidden');
            } catch (error) {
                alert('Erro ao solicitar permissão do microfone. Por favor, permita o acesso ao microfone nas configurações do navegador.');
            }
        }

        // Reconhecimento de voz
        function startVoiceRecognition(fieldId) {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Reconhecimento de voz não é suportado neste navegador');
                return;
            }

            const field = document.getElementById(fieldId);
            const button = field.parentElement.querySelector('.voice-btn');
            
            if (!field || !button) {
                console.error('Campo ou botão não encontrado:', fieldId);
                return;
            }

            if (recognition) {
                recognition.stop();
            }

            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'pt-BR';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            button.classList.add('recording');
            
            recognition.onstart = function() {
                console.log('Reconhecimento iniciado para:', fieldId);
            };

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                console.log('Texto reconhecido:', transcript);
                
                if (field.tagName === 'TEXTAREA') {
                    field.value += (field.value ? ' ' : '') + transcript;
                } else {
                    field.value = transcript;
                }
                
                field.dispatchEvent(new Event('input'));
                field.dispatchEvent(new Event('change'));
                updateCalculations();
            };

            recognition.onerror = function(event) {
                console.error('Erro no reconhecimento de voz:', event.error);
                button.classList.add('error');
                setTimeout(() => button.classList.remove('error'), 3000);
                
                if (event.error === 'not-allowed') {
                    alert('Permissão do microfone negada. Por favor, permita o acesso ao microfone.');
                } else {
                    alert('Erro no reconhecimento de voz: ' + event.error);
                }
            };

            recognition.onend = function() {
                button.classList.remove('recording');
                console.log('Reconhecimento finalizado');
            };

            try {
                recognition.start();
            } catch (error) {
                console.error('Erro ao iniciar reconhecimento:', error);
                button.classList.remove('recording');
                alert('Erro ao iniciar o reconhecimento de voz');
            }
        }

        // Lidar com upload de fotos
        function handleFileUpload(input) {
            const files = Array.from(input.files);
            
            if (fotosUploaded.length + files.length > 10) {
                alert('Máximo de 10 fotos permitidas. Por favor, selecione menos fotos.');
                input.value = '';
                return;
            }
            
            files.forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    if (file.size > 5 * 1024 * 1024) {
                        alert(`A foto "${file.name}" é muito grande (máx. 5MB). Por favor, selecione uma foto menor.`);
                        return;
                    }
                    
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        const fotoData = {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: e.target.result,
                            id: Date.now() + index
                        };
                        
                        fotosUploaded.push(fotoData);
                        addFotoPreview(fotoData);
                        updateFotosCount();
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    alert(`O arquivo "${file.name}" não é uma imagem válida.`);
                }
            });
            
            input.value = '';
        }

        // Adicionar preview da foto
        function addFotoPreview(fotoData) {
            const fotosPreview = document.getElementById('fotos-preview');
            const fotoDiv = document.createElement('div');
            fotoDiv.className = 'foto-preview';
            fotoDiv.
