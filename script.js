import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_k47MOMZWXLtZPL4p-kBNtJ_PtwR09Lg",
  authDomain: "volpatifisio.firebaseapp.com",
  projectId: "volpatifisio",
  storageBucket: "volpatifisio.firebasestorage.app",
  messagingSenderId: "1070135048104",
  appId: "1:1070135048104:web:ec930b7b664d8c23180f9d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let pacientes = [];
let pacienteAtualId = null;

const marcosModulares = [
    { dias: 0, titulo: "Cirurgia", desc: "Checklist de apresentação" },
    { dias: 1, titulo: "Troca de Curativo", desc: "Instruções de drenagem" },
    { dias: 10, titulo: "10º Dia: Mobilidade", desc: "Sentar e levantar, elevação pélvica" },
    { dias: 15, titulo: "15º Dia: Pontos", desc: "Retirada de pontos e marcha" },
    { dias: 20, titulo: "20º Dia: Fortalecimento", desc: "Agachamento e Kabat" },
    { dias: 30, titulo: "30º Dia: Carga", desc: "Evolução de carga avançada" }
];

document.getElementById('btnLogin').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginSenha').value)
    .catch(e => alert("Erro: " + e.message));
};
document.getElementById('btnLogout').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    document.getElementById('loadingScreen').classList.add('hidden');
    if (user) {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('appContent').classList.remove('hidden');
        ouvirDados();
    } else {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('appContent').classList.add('hidden');
    }
});

function ouvirDados() {
    onSnapshot(query(collection(db, "pacientes"), orderBy("nome")), (snapshot) => {
        pacientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarLista();
        if (pacienteAtualId) atualizarChecklistVisual();
    });
}

async function salvarPaciente() {
    const nome = document.getElementById('pacienteNome').value;
    const proc = document.getElementById('pacienteProcedimento').value;
    const data = document.getElementById('dataCirurgia').value;
    const editId = document.getElementById('editId').value;

    if (!nome || !data) return alert("Preencha Nome e Data!");

    const dados = { nome, procedimento: proc, data };

    if (editId) {
        await updateDoc(doc(db, "pacientes", editId), dados);
        document.getElementById('editId').value = "";
        document.getElementById('formTitle').innerText = "Novo Cadastro";
    } else {
        await addDoc(collection(db, "pacientes"), { ...dados, notas: "", checklist: [] });
    }
    limparForm();
}

function limparForm() {
    ['pacienteNome', 'pacienteProcedimento', 'dataCirurgia'].forEach(id => document.getElementById(id).value = "");
}

document.getElementById('btnSalvar').onclick = salvarPaciente;

async function atualizarChecklistVisual() {
    const p = pacientes.find(x => x.id === pacienteAtualId);
    const container = document.getElementById('checklistContainer');
    if (!container) return;
    container.innerHTML = '';
    const tarefas = Array.isArray(p.checklist) ? p.checklist : [];

    tarefas.forEach((tarefa, index) => {
        const item = document.createElement('div');
        item.className = "flex items-center gap-2 group fade-in";
        item.innerHTML = `
            <div onclick="alternarTarefa(${index})" class="w-5 h-5 border-2 ${tarefa.feito ? 'bg-blue-500 border-blue-500' : 'border-blue-300'} rounded-full cursor-pointer flex items-center justify-center transition-all">
                ${tarefa.feito ? '<span class="text-white text-[10px]">✓</span>' : ''}
            </div>
            <span class="text-sm ${tarefa.feito ? 'text-slate-400 line-through' : 'text-slate-700'} flex-grow">${tarefa.texto}</span>
            <button onclick="removerTarefa(${index})" class="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
        `;
        container.appendChild(item);
    });
}

window.alternarTarefa = async (index) => {
    const p = pacientes.find(x => x.id === pacienteAtualId);
    let n = [...p.checklist];
    n[index].feito = !n[index].feito;
    await updateDoc(doc(db, "pacientes", pacienteAtualId), { checklist: n });
};

window.removerTarefa = async (index) => {
    const p = pacientes.find(x => x.id === pacienteAtualId);
    let n = [...p.checklist];
    n.splice(index, 1);
    await updateDoc(doc(db, "pacientes", pacienteAtualId), { checklist: n });
};

document.getElementById('addTarefaBtn').onclick = async () => {
    const input = document.getElementById('novaTarefaInput');
    if (!input.value.trim() || !pacienteAtualId) return;
    const p = pacientes.find(x => x.id === pacienteAtualId);
    const atuais = Array.isArray(p.checklist) ? p.checklist : [];
    await updateDoc(doc(db, "pacientes", pacienteAtualId), { 
        checklist: [...atuais, { texto: input.value.trim(), feito: false }] 
    });
    input.value = '';
};

document.getElementById('novaTarefaInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addTarefaBtn').click(); }
});

window.visualizarCronograma = (id) => {
    pacienteAtualId = id;
    const p = pacientes.find(x => x.id === id);
    document.getElementById('placeholder').classList.add('hidden');
    document.getElementById('cronogramaContainer').classList.remove('hidden');
    
    const hoje = new Date();
    const dataCirurgia = new Date(p.data + 'T00:00:00');
    const diffTime = hoje - dataCirurgia;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const labelDias = diffDays === 0 ? "Dia da Cirurgia" : (diffDays > 0 ? `${diffDays} dias de pós` : `Faltam ${Math.abs(diffDays)} dias`);

    document.getElementById('nomeDisplay').innerHTML = `
        <span class="text-blue-500 text-[10px] font-bold uppercase tracking-widest">${p.procedimento || 'FISIOTERAPIA'} • ${labelDias}</span>
        <h2 class="text-2xl font-black text-slate-800">${p.nome}</h2>
    `;
    
    atualizarChecklistVisual();
    const notasField = document.getElementById('notasRapidas');
    notasField.value = p.notas || "";
    notasField.onblur = async () => await updateDoc(doc(db, "pacientes", p.id), { notas: notasField.value });

    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    marcosModulares.forEach(m => {
        const dt = new Date(dataCirurgia);
        dt.setDate(dataCirurgia.getDate() + m.dias);
        const gDate = dt.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];
        const gUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.titulo + ': ' + p.nome)}&dates=${gDate}/${gDate}&details=${encodeURIComponent(m.desc)}&sf=true&output=xml`;

        timeline.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center">
                <div>
                    <p class="text-blue-600 font-bold text-xs">${dt.toLocaleDateString('pt-BR')}</p>
                    <h3 class="font-bold text-slate-800 my-1">${m.titulo}</h3>
                    <p class="text-[11px] text-slate-500">${m.desc}</p>
                </div>
                <a href="${gUrl}" target="_blank" class="bg-slate-50 hover:bg-blue-100 p-2.5 rounded-full transition-all">📅</a>
            </div>`;
    });

    document.getElementById('btnZap').onclick = () => {
        const d = p.data.split('-').reverse().join('/');
        let msg = `*PLANO DE RECUPERAÇÃO: ${p.nome.toUpperCase()}*\nProcedimento: ${p.procedimento || '---'}\nData: ${d}\nStatus: ${labelDias}\n\n`;
        marcosModulares.forEach(m => {
            const dt = new Date(dataCirurgia);
            dt.setDate(dataCirurgia.getDate() + m.dias);
            msg += `✅ *${dt.toLocaleDateString('pt-BR')}*\n*${m.titulo}*\n${m.desc}\n\n`;
        });
        navigator.clipboard.writeText(msg).then(() => alert("Copiado com sucesso!"));
    };
};

function renderizarLista() {
    const lista = document.getElementById('listaPacientes');
    lista.innerHTML = '';
    pacientes.forEach((p) => {
        const div = document.createElement('div');
        div.className = "p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-400 cursor-pointer shadow-sm flex justify-between items-center";
        div.innerHTML = `
            <div onclick="visualizarCronograma('${p.id}')" class="flex-grow">
                <p class="font-bold text-slate-700 text-sm">${p.nome}</p>
                <p class="text-[11px] text-slate-400 font-medium uppercase">${p.procedimento || '---'}</p>
            </div>
            <div class="flex gap-2 text-slate-300">
                <button onclick="prepararEdicao('${p.id}')" class="hover:text-blue-500">✎</button>
                <button onclick="excluirPaciente('${p.id}')" class="hover:text-red-500">✕</button>
            </div>`;
        lista.appendChild(div);
    });
}

window.prepararEdicao = (id) => {
    const p = pacientes.find(x => x.id === id);
    document.getElementById('pacienteNome').value = p.nome;
    document.getElementById('pacienteProcedimento').value = p.procedimento;
    document.getElementById('dataCirurgia').value = p.data;
    document.getElementById('editId').value = p.id;
    document.getElementById('formTitle').innerText = "Editando Registro";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.excluirPaciente = async (id) => {
    if(confirm("Remover paciente?")) await deleteDoc(doc(db, "pacientes", id));
};

document.getElementById('buscaPaciente').onkeyup = () => {
    const termo = document.getElementById('buscaPaciente').value.toLowerCase();
    document.querySelectorAll('#listaPacientes > div').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(termo) ? '' : 'none';
    });
};
