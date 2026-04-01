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
    const dataInput = document.getElementById('dataCirurgia');
    const editIndexInput = document.getElementById('editIndex');

    const nome = nomeInput.value;
    const data = dataInput.value;
    const editIndex = parseInt(editIndexInput.value);

    if (!nome || !data) {
        alert("Preencha o nome e a data!");
        return;
    }

    const novoPaciente = { nome, data };

    if (editIndex > -1) {
        pacientes[editIndex] = novoPaciente;
        document.getElementById('editIndex').value = "-1";
        document.getElementById('formTitle').innerText = "Novo Cadastro";
    } else {
        pacientes.push(novoPaciente);
    }

    localStorage.setItem('fisio_pacientes', JSON.stringify(pacientes));
    
    nomeInput.value = '';
    dataInput.value = '';
    document.getElementById('btnSalvar').innerText = "Salvar Paciente";

    renderizarLista();
}

function renderizarLista() {
    const lista = document.getElementById('listaPacientes');
    if (!lista) return;
    lista.innerHTML = '';

    pacientes.forEach((p, index) => {
        lista.innerHTML += `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 group transition-all hover:border-blue-300 mb-2">
                <div class="flex justify-between items-start">
                    <div class="cursor-pointer flex-1" onclick="visualizarCronograma(${index})">
                        <p class="font-bold text-slate-700 group-hover:text-blue-600">${p.nome}</p>
                        <p class="text-xs text-slate-500">Cirurgia: ${p.data.split('-').reverse().join('/')}</p>
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
        <span class="text-blue-600 block text-sm uppercase tracking-widest">Paciente</span>
        ${p.nome}
    `;
    
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    const dataBase = new Date(p.data);

    marcosModulares.forEach(marco => {
        const dataMarco = new Date(dataBase);
        dataMarco.setDate(dataMarco.getDate() + marco.dias + 1);
        
        const dataISO = dataMarco.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const gLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=Fisio:+${p.nome}+(${marco.titulo})&dates=${dataISO}/${dataISO}&details=${marco.desc}&sf=true&output=xml`;

        timeline.innerHTML += `
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center mb-3">
                <div>
                    <span class="text-xs font-bold text-blue-500 uppercase">${dataMarco.toLocaleDateString('pt-BR')}</span>
                    <h3 class="font-bold text-slate-700">${marco.titulo}</h3>
                    <p class="text-sm text-slate-500">${marco.desc}</p>
                </div>
                <a href="${gLink}" target="_blank" class="bg-slate-100 hover:bg-blue-100 p-2 rounded-full transition-colors">
                    📅
                </a>
            </div>
        `;
    });

    document.getElementById('cronogramaContainer').dataset.currentIndex = index;
}

function exportarWhatsApp() {
    const index = document.getElementById('cronogramaContainer').dataset.currentIndex;
    if (index === undefined) return;

    const p = pacientes[index];
    const dataBase = new Date(p.data);
    
    let textoMensagem = `*PLANO DE RECUPERAÇÃO: ${p.nome.toUpperCase()}*\n`;
    textoMensagem += `Data da Cirurgia: ${dataBase.toLocaleDateString('pt-BR')}\n`;
    textoMensagem += `------------------------------------------\n\n`;

    marcosModulares.forEach(marco => {
        const dataMarco = new Date(dataBase);
        dataMarco.setDate(dataMarco.getDate() + marco.dias + 1);
        textoMensagem += `✅ *${dataMarco.toLocaleDateString('pt-BR')}*\n*${marco.titulo}*\n${marco.desc}\n\n`;
    });

    navigator.clipboard.writeText(textoMensagem).then(() => {
        alert("Copiado para o WhatsApp!");
    });
}

// --- FUNÇÕES AUXILIARES (EDITAR E EXCLUIR) ---
function prepararEdicao(index) {
    const p = pacientes[index];
    document.getElementById('pacienteNome').value = p.nome;
    document.getElementById('dataCirurgia').value = p.data;
    document.getElementById('editIndex').value = index;
    document.getElementById('formTitle').innerText = "Editando Paciente";
    document.getElementById('btnSalvar').innerText = "Atualizar Cadastro";
}

function excluirPaciente(index) {
    if (confirm("Excluir este paciente?")) {
        pacientes.splice(index, 1);
        localStorage.setItem('fisio_pacientes', JSON.stringify(pacientes));
        renderizarLista();
        document.getElementById('cronogramaContainer').classList.add('hidden');
        document.getElementById('placeholder').classList.remove('hidden');
    }
}