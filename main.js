let config = { 
    sinal: 0, 
    massas: {}, 
    recheios: {}, 
    coberturas: {}, 
    tamanhos: {}, 
    clientes: [] };
    
    let pedidos = [];
    let dataSelecionada = {};
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    function salvarTudo() {
        localStorage.setItem('conf_pedidos', JSON.stringify(pedidos)); 
        localStorage.setItem('conf_config', JSON.stringify(config)); 
    }
    
    function init() {
        const pS = localStorage.getItem('conf_pedidos'), 
        cS = localStorage.getItem('conf_config');
        if(pS) pedidos = JSON.parse(pS);
        if(cS) config = JSON.parse(cS);
        document.getElementById('cfgSinal').value = config.sinal || 0;
        
        const selM = document.getElementById('selMes');
        selM.innerHTML = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => `<option value="${i}">${m}</option>`).join('');
        
        document.getElementById('selAno').innerHTML = `<option>${new Date().getFullYear()}</option><option>${new Date().getFullYear()+1}</option>`;
        selM.value = new Date().getMonth();
        renderCalendar();
    }

    function updateClienteInfo(idx, campo, valor) {
         config.clientes[idx][campo] = valor; salvarTudo(); 
    }
    
    function addClienteManual() {
        const n = document.getElementById('addNomeCli').value.trim(), 
        c = document.getElementById('addContCli').value.trim();
        
        if(n) { config.clientes.push({nome: n, contato: c}); 
            salvarTudo(); 
            updateEditLists(); 
            document.getElementById('addNomeCli').value=''; 
            document.getElementById('addContCli').value=''; 
        }
    }

    function addItemCardapio() {
        const n = document.getElementById('addNomeItem').value.trim(), 
        p = parseFloat(document.getElementById('addPrecoItem').value) || 0, 
        t = document.getElementById('addTipoItem').value;
        if(n) { 
            config[t][n] = p;
             salvarTudo(); 
             updateEditLists(); 
             document.getElementById('addNomeItem').value=''; 
             document.getElementById('addPrecoItem').value=''; 
        }
    }

    function updateEditLists() {
        let h = "";
        ['massas', 'recheios', 'coberturas', 'tamanhos'].forEach(t => {
            h += `<div style="
            background:#eee; 
            padding:5px; 
            margin-top:10px; 
            font-weight:bold; 
            font-size:0.7em">
            ${t.toUpperCase()}</div>`;

            for(let i in config[t]) h += `<div class="list-item">${i} (R$ ${config[t][i].toFixed(2)}) 
            <button onclick="delete config['${t}']['${i}']; 
            salvarTudo(); 
            updateEditLists()" style="background:red; padding:2px 6px">X</button></div>`;
        });
        document.getElementById('listCardapio').innerHTML = h;
        const term = (document.getElementById('searchCli').value || "").toLowerCase();
        document.getElementById('listClientes').innerHTML = config.clientes.map((c, i) => ({...c, idx: i})).filter(c => c.nome.toLowerCase().includes(term)).map(c => `
            <div class="list-item">
                <div class="client-edit-row"><input type="text" value="${c.nome}" onchange="updateClienteInfo(${c.idx}, 'nome', this.value)"><input type="text" value="${c.contato||''}" onchange="updateClienteInfo(${c.idx}, 'contato', this.value)"></div>
                <button onclick="config.clientes.splice(${c.idx},1); salvarTudo(); updateEditLists()" style="background:red">X</button>
            </div>`).join('');
    }

    function calcTotal() {
        const s = parseFloat(config.sinal) || 0, 
        m = config.massas[document.getElementById('pMassa').value] || 0, 
        r = config.recheios[document.getElementById('pRecheio').value] || 0, 
        c = config.coberturas[document.getElementById('pCobertura').value] || 0, 
        t = config.tamanhos[document.getElementById('pTamanho').value] || 0, 
        cam = parseInt(document.getElementById('pCamadas').value) || 1;
        document.getElementById('totalDisplay').innerText = (s + m + (r * cam) + c + t).toFixed(2);
    }

    function salvarPedido() {
    // 1. Definição de Datas para a trava retroativa
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const anoAtivo = parseInt(document.getElementById('selAno').value);
    const dataPedido = new Date(anoAtivo, dataSelecionada.m, dataSelecionada.d);

    // Trava de data retroativa
    if (dataPedido < hoje) {
        alert("⚠️ Não é possível adicionar ou editar pedidos em datas que já passaram!");
        return;
    }

    // 2. Captura dos valores dos inputs
    const nome = document.getElementById('pNome').value.trim();
    const contato = document.getElementById('pContato').value.trim();
    const massa = document.getElementById('pMassa').value;
    const tamanho = document.getElementById('pTamanho').value;
    const recheio = document.getElementById('pRecheio').value;

    // 3. Validação de campos obrigatórios (Unificada)
    if (!nome || !contato || !massa || massa === "Vazio" || !tamanho || tamanho === "Vazio") {
        alert("⚠️ Os campos Nome, Contato, Massa e Tamanho são obrigatórios!");
        return; 
    }

    // 4. Criação do objeto do pedido
    const idExistente = document.getElementById('pId').value;
    const p = { 
        id: idExistente || Date.now(), 
        nome, 
        contato, 
        massa, 
        recheio,
        cobertura: document.getElementById('pCobertura').value, 
        tamanho, 
        camadas: parseInt(document.getElementById('pCamadas').value) || 1, 
        dia: dataSelecionada.d, 
        mes: dataSelecionada.m, 
        local: idExistente ? pedidos.find(x => x.id == idExistente).local : 'pendentes' 
    };

    // 5. Atualização da lista e salvamento
    if(idExistente) {
        pedidos = pedidos.map(x => x.id == idExistente ? p : x);
    } else {
        pedidos.push(p);
    }
    
    if(nome && !config.clientes.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
        config.clientes.push({nome, contato: p.contato});
    }

    salvarTudo(); 
    closeModal('modalForm'); 
    renderCalendar(); 
    if(typeof renderAgenda === "function") renderAgenda();

    // 6. Gerar Recibo Visual
    const vSinal = parseFloat(config.sinal) || 0;
    const vMassa = config.massas[p.massa] || 0;
    const vRecheio = (config.recheios[p.recheio] || 0) * p.camadas;
    const vCobertura = config.coberturas[p.cobertura] || 0;
    const vTamanho = config.tamanhos[p.tamanho] || 0;
    
    const total = (vSinal + vMassa + vRecheio + vCobertura + vTamanho).toFixed(2);

    document.getElementById('reciboConteudo').innerHTML = `
        <div class="recibo-linha"><b>Cliente:</b> ${p.nome}</div>
        <div class="recibo-linha"><b>Contato:</b> ${p.contato}</div>
        <div class="recibo-linha"><b>Bolo:</b> ${p.massa}, ${p.tamanho} - <b>R$ ${total}</b></div>
        <div class="recibo-linha"><b>Sinal:</b> R$ ${vSinal.toFixed(2)} (incluso)</div>
    `;
    document.getElementById('modalRecibo').style.display = 'flex';
}



    function renderCalendar() {
        const grid = document.getElementById('calGrid'); grid.innerHTML = '';
        const m = parseInt(document.getElementById('selMes').value), 
        a = parseInt(document.getElementById('selAno').value);
        const dias = new Date(a, m + 1, 0).getDate();
        for (let i = 1; i <= dias; i++) {
            const ords = pedidos.filter(p => p.dia == i && p.mes == m);
            const slot = document.createElement('div'); slot.className = 'day-slot';
            slot.innerHTML = `<span class="day-number">${i}</span><span class="day-status">${ords.length || ''}</span>`;
            slot.onclick = () => { dataSelecionada = {d:i, m:m}; openListaDia(i, m); };
            grid.appendChild(slot);
        }
    }

    function openListaDia(d, m) {
        dataSelecionada = {d, m}; document.getElementById('modalListaDia').style.display = 'flex';
        document.getElementById('tituloListaDia').innerText = `Pedidos: ${d}/${m+1}`;
        const ords = pedidos.filter(p => p.dia == d && p.mes == m);
        document.getElementById('corpoListaDia').innerHTML = ords.map(p => `<div class="list-item"><b>${p.nome}</b> <div><button onclick="openFormPedido(${p.id})" style="background:#ffc107; color:#333">Ed</button> <button onclick="removerPedido(${p.id})" style="background:red">X</button></div></div>`).join('') || 'Vazio';
    }

    function renderAgenda() {
        const lp = document.getElementById('listaCardsPendentes'); lp.innerHTML = '';
        pedidos.filter(p => p.local === 'pendentes').forEach(p => lp.appendChild(createOrderCard(p)));
        const wg = document.getElementById('weekGrid'); wg.innerHTML = '';
        for(let i=0; i<7; i++) {
            const col = document.createElement('div'); col.className = 'week-column'; 
            col.innerHTML = `<div class="week-header">${diasSemana[i]}</div>`;
            col.ondragover = allowDrop; 
            col.ondrop = e => handleDrop(e, i);
            pedidos.filter(p => p.local === i).forEach(p => col.appendChild(createOrderCard(p)));
            wg.appendChild(col);
        }
    }

   function createOrderCard(p) {
    // Lógica para esconder o card se a data de entrega já passou
    const hoje = new Date().setHours(0, 0, 0, 0);
    const anoAtivo = parseInt(document.getElementById('selAno').value);
    const dataEntregaObj = new Date(anoAtivo, p.mes, p.dia);

    if (p.local !== 'pendentes' && dataEntregaObj.getTime() < hoje) {
        return document.createTextNode(''); 
    }

    const c = document.createElement('div'); 
    c.className = 'order-card';
    c.draggable = true;
    c.ondragstart = e => e.dataTransfer.setData("text", p.id);
    
    // Formata o dia e mês para exibição (ex: 05/04)
    const diaFormatado = String(p.dia).padStart(2, '0');
    const mesFormatado = String(p.mes + 1).padStart(2, '0');

    c.innerHTML = `
        <div style="flex-grow: 1; pointer-events: none;">
            <div style="font-weight: bold;">${p.nome}</div>
            <div style="font-size: 12px; color: white;">
                Entrega: ${diaFormatado}/${mesFormatado}
            </div>
        </div>
        <button onclick="event.stopPropagation(); removerPedidoCard('${p.id}')" 
                style="background:none; border:none; color:white; font-weight:bold; cursor:pointer; padding: 5px;">
            X
        </button>
    `;

    c.onclick = () => openFormPedido(p.id);
    c.style.display = 'flex';
    c.style.justifyContent = 'space-between';
    c.style.alignItems = 'center';
    
    return c;
}


// Função auxiliar para o botão de deletar do card (sem fechar modais inexistentes)
function removerPedidoCard(id) {
    if(confirm("Deseja excluir este pedido?")) {
        pedidos = pedidos.filter(p => p.id != id);
        salvarTudo();
        renderCalendar();
        renderAgenda();
    }
}


    function handleDrop(e, loc) { 
        e.preventDefault(); 
        const id = e.dataTransfer.getData("text"); 
        const p = pedidos.find(x => x.id == id); 
        if(p) { 
            p.local = loc; 
            salvarTudo(); 
            renderAgenda(); 
        } 
    }
    
    function allowDrop(e) { 
        e.preventDefault(); 
    }
    
    function closeModal(id) { 
        document.getElementById(id).style.display = 'none'; 
    }
    
    function removerPedido(id) { 
        pedidos = pedidos.filter(p => p.id != id); salvarTudo(); 
        renderCalendar(); 
        renderAgenda(); 
        openListaDia(dataSelecionada.d, dataSelecionada.m); 
    }
    
    function openFormPedido(id = null) {
        closeModal('modalListaDia'); 
        document.getElementById('modalForm').style.display = 'flex';
        const carregar = (idSel, obj) => { 
            const k = Object.keys(obj); 
            document.getElementById(idSel).innerHTML = k.length ? k.map(x => `<option value="${x}">${x}</option>`).join('') : '<option disabled>Vazio</option>'; 
        };
        
        carregar('pMassa', config.massas); 
        carregar('pRecheio', config.recheios); 
        carregar('pCobertura', config.coberturas);
        carregar('pTamanho', config.tamanhos);
        if(id) { 
            const p = pedidos.find(x => x.id == id); document.getElementById('pId').value = p.id; 
            document.getElementById('pNome').value = p.nome; 
            document.getElementById('pContato').value = p.contato || ''; 
            document.getElementById('pCamadas').value = p.camadas || 1; 
        }else { 
            document.getElementById('pId').value = ''; document.getElementById('pNome').value = ''; 
            document.getElementById('pContato').value = ''; 
        }
        calcTotal();
    }


    function imprimirRecibo() {
    const conteudo = document.getElementById('reciboConteudo').innerHTML;
    const janelaImpressao = window.open('', '', 'width=600,height=600');
    
    janelaImpressao.document.write(`
        <html>
            <head>
                <title>Recibo de Pedido</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; text-align: center; }
                    .recibo-linha { margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
                    h2 { color: #333; }
                </style>
            </head>
            <body>
                <h2>📄 Recibo de Pedido</h2>
                ${conteudo}
                <br>
                <p style="font-size: 12px;">Gerado em: ${new Date().toLocaleString()}</p>
            </body>
        </html>
    `);
    
    janelaImpressao.document.close();
    janelaImpressao.print();
    janelaImpressao.close();
}

    
    function showPage(p) { 
        document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active')); 
        document.getElementById(p).classList.add('active'); 
        if(p === 'editar') updateEditLists(); 
        if(p === 'agenda') renderAgenda(); 
    }

    window.onload = init;
