let pacientes = JSON.parse(localStorage.getItem('fisio_pacientes')) || [];

const marcosModulares = [
    { dias: 0, titulo: "Cirurgia", desc: "Checklist de apresentação" },
    { dias: 1, titulo: "Troca de Curativo", desc: "Instruções de drenagem" },
    { dias: 10, titulo: "10º Dia: Mobilidade", desc: "Sentar e levantar, elevação pélvica" },
    { dias: 15, titulo: "15º Dia: Pontos", desc: "Retirada de pontos e marcha" },
    { dias: 20, titulo: "20º Dia: Fortalecimento", desc: "Agachamento e Kabat" },
    { dias: 30, titulo: "30º Dia: Carga", desc: "Evolução de carga avançada" }
];

document.addEventListener('DOMContentLoaded', renderizarLista);

function salvarPaciente() {
    const nomeInput = document.getElementById('pacienteNome');
    const procInput = document.getElementById('pacienteProcedimento');
    const dataInput = document.getElementById('dataCirurgia');
    const editIndexInput = document.getElementById('editIndex');

    if (!nomeInput.value || !dataInput.value) {
        alert("Por favor, preencha o nome e a data da cirurgia.");
        return;
    }

    let nomeFormatado = nomeInput.value.toLowerCase().split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(' ');

    const novoPaciente = { 
        nome: nomeFormatado, 
        procedimento: procInput.value || "Procedimento não informado",
        data: dataInput.value 
    };

    const editIndex = parseInt(editIndexInput.value);

    if (editIndex > -1) {
        pacientes[editIndex] = novoPaciente;
        editIndexInput.value = "-1";
        document.getElementById('formTitle').innerText = "Novo Cadastro";
    } else {
        pacientes.push(novoPaciente);
    }

    localStorage.setItem('fisio_pacientes', JSON.stringify(pacientes));
    
    nomeInput.value = '';
    procInput.value = '';
    dataInput.value = '';
    document.getElementById('btnSalvar').innerText = "Salvar Paciente";

    renderizarLista();
}

function renderizarLista() {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;
    lista.innerHTML = '';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    pacientes.forEach((p, index) => {
        const dataCirurgia = new Date(p.data + 'T00:00:00');
        const dataExibicao = p.data.split('-').reverse().join('/');
        
        const diffTempo = hoje - dataCirurgia;
        const diffDias = Math.floor(diffTempo / (1000 * 60 * 60 * 24));

        const badge60 = diffDias >= 60 ? 
            `<span class="ml-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse border border-orange-200">⚠️ 60 DIAS</span>` : '';

        lista.innerHTML += `
            <div class="item-paciente p-3 bg-slate-50 rounded-xl border border-slate-200 group transition-all hover:border-blue-300 mb-2">
                <div class="flex justify-between items-start">
                    <div class="cursor-pointer flex-1" onclick="visualizarCronograma(${index})">
                        <div class="flex items-center">
                            <p class="font-bold text-slate-700 group-hover:text-blue-600">${p.nome}</p>
                            ${badge60}
                        </div>
                        <p class="text-[11px] text-blue-500 font-medium leading-tight">${p.procedimento}</p>
                        <p class="text-[10px] text-slate-400 mt-1">Cirurgia: ${dataExibicao} (${diffDias} dias decorridos)</p>
                    </div>
                    <div class="flex gap-2 ml-2">
                        <button onclick="prepararEdicao(${index})" class="text-blue-500 hover:text-blue-700">✎</button>
                        <button onclick="excluirPaciente(${index})" class="text-red-400 hover:text-red-600">✕</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function visualizarCronograma(index) {
    const p = pacientes[index];
    document.getElementById('placeholder').classList.add('hidden');
    document.getElementById('cronogramaContainer').classList.remove('hidden');
    
    document.getElementById('nomeDisplay').innerHTML = `
        <span class="text-blue-600 block text-xs uppercase tracking-widest font-bold mb-1">${p.procedimento}</span>
        <h2 class="text-2xl font-bold text-blue-900">${p.nome}</h2>
    `;
    
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    const dataBase = new Date(p.data + 'T00:00:00');

    marcosModulares.forEach(marco => {
        const dataMarco = new Date(dataBase);
        dataMarco.setDate(dataBase.getDate() + marco.dias);
        
        const dataISO = dataMarco.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const gLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=Fisio:+${p.nome}+(${marco.titulo})&dates=${dataISO}/${dataISO}&details=${marco.desc}&sf=true&output=xml`;

        timeline.innerHTML += `
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                    <span class="text-xs font-bold text-blue-500 uppercase">${dataMarco.toLocaleDateString('pt-BR')}</span>
                    <h3 class="font-bold text-slate-700">${marco.titulo}</h3>
                    <p class="text-sm text-slate-500">${marco.desc}</p>
                </div>
                <a href="${gLink}" target="_blank" class="bg-slate-100 hover:bg-blue-100 p-2 rounded-full transition-colors">📅</a>
            </div>
        `;
    });

    document.getElementById('cronogramaContainer').dataset.currentIndex = index;
}

function exportarWhatsApp() {
    const index = document.getElementById('cronogramaContainer').dataset.currentIndex;
    if (index === undefined) return;

    const p = pacientes[index];
    const dataBase = new Date(p.data + 'T00:00:00');
    
    let msg = `*PLANO DE RECUPERAÇÃO: ${p.nome.toUpperCase()}*\n`;
    msg += `Procedimento: ${p.procedimento}\n`;
    msg += `Data da Cirurgia: ${dataBase.toLocaleDateString('pt-BR')}\n`;
    msg += `------------------------------------------\n\n`;

    marcosModulares.forEach(marco => {
        const dataMarco = new Date(dataBase);
        dataMarco.setDate(dataBase.getDate() + marco.dias);
        msg += `✅ *${dataMarco.toLocaleDateString('pt-BR')}*\n*${marco.titulo}*\n${marco.desc}\n\n`;
    });

    msg += `_Gerado por Volpati Fisio Pro_`;

    navigator.clipboard.writeText(msg).then(() => {
        alert("Copiado para o WhatsApp!");
    });
}

function filtrarPacientes() {
    const termo = document.getElementById('buscaPaciente').value.toLowerCase();
    const itens = document.getElementsByClassName('item-paciente');

    for (let i = 0; i < itens.length; i++) {
        let texto = itens[i].innerText.toLowerCase();
        itens[i].style.display = texto.includes(termo) ? "" : "none";
    }
}

function prepararEdicao(index) {
    const p = pacientes[index];
    document.getElementById('pacienteNome').value = p.nome;
    document.getElementById('pacienteProcedimento').value = p.procedimento || "";
    document.getElementById('dataCirurgia').value = p.data;
    document.getElementById('editIndex').value = index;
    document.getElementById('formTitle').innerText = "Editando Paciente";
    document.getElementById('btnSalvar').innerText = "Atualizar Cadastro";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function excluirPaciente(index) {
    if (confirm("Excluir este paciente permanentemente?")) {
        pacientes.splice(index, 1);
        localStorage.setItem('fisio_pacientes', JSON.stringify(pacientes));
        renderizarLista();
        document.getElementById('cronogramaContainer').classList.add('hidden');
        document.getElementById('placeholder').classList.remove('hidden');
    }
}
