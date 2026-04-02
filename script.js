import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
const marcosModulares = [
    { dias: 0, titulo: "Cirurgia", desc: "Checklist de apresentação" },
    { dias: 1, titulo: "Troca de Curativo", desc: "Instruções de drenagem" },
    { dias: 10, titulo: "10º Dia: Mobilidade", desc: "Sentar e levantar" },
    { dias: 15, titulo: "15º Dia: Pontos", desc: "Retirada de pontos" },
    { dias: 20, titulo: "20º Dia: Fortalecimento", desc: "Agachamento e Kabat" },
    { dias: 30, titulo: "30º Dia: Carga", desc: "Evolução de carga avançada" }
];

document.getElementById('btnLogin').onclick = () => {
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    signInWithEmailAndPassword(auth, email, senha).catch(e => alert("Acesso negado: " + e.message));
};

document.getElementById('btnLogout').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('appContent').classList.remove('hidden');
        ouvirDados(); // Sincronização em tempo real
    } else {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('appContent').classList.add('hidden');
    }
});

// --- BANCO DE DADOS EM TEMPO REAL ---
function ouvirDados() {
    const q = query(collection(db, "pacientes"), orderBy("nome"));
    onSnapshot(q, (snapshot) => {
        pacientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarLista();
    });
}

// --- SALVAR (MAIÚSCULAS + ENTER) ---
async function salvarPaciente() {
    const nome = document.getElementById('pacienteNome').value;
    const proc = document.getElementById('pacienteProcedimento').value;
    const data = document.getElementById('dataCirurgia').value;
    const editId = document.getElementById('editId').value;

    if (!nome || !data) return alert("Preencha Nome e Data!");

    const formatar = (str) => str.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

    const dados = {
        nome: formatar(nome),
        procedimento: formatar(proc),
        data: data
    };

    if (editId) {
        await updateDoc(doc(db, "pacientes", editId), dados);
        document.getElementById('editId').value = "";
        document.getElementById('formTitle').innerText = "Novo Cadastro";
    } else {
        await addDoc(collection(db, "pacientes"), dados);
    }

    document.getElementById('pacienteNome').value = "";
    document.getElementById('pacienteProcedimento').value = "";
    document.getElementById('dataCirurgia').value = "";
}

document.getElementById('btnSalvar').onclick = salvarPaciente;

// Atalho Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.tagName === 'INPUT') salvarPaciente();
});

// --- RENDERIZAR E CRONOGRAMA ---
function renderizarLista() {
    const lista = document.getElementById('listaPacientes');
    lista.innerHTML = '';
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    pacientes.forEach((p) => {
        const dataC = new Date(p.data + 'T00:00:00');
        const diff = Math.floor((hoje - dataC) / (1000 * 60 * 60 * 24));
        const badge = diff >= 60 ? `<span class="ml-2 bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full animate-pulse">⚠️ 60 DIAS</span>` : '';

        const div = document.createElement('div');
        div.className = "p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2 cursor-pointer hover:border-blue-300";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div onclick="visualizarCronograma('${p.id}')">
                    <p class="font-bold text-slate-700">${p.nome} ${badge}</p>
                    <p class="text-[11px] text-blue-500">${p.procedimento}</p>
                    <p class="text-[10px] text-slate-400">Há ${diff} dias</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="prepararEdicao('${p.id}')">✎</button>
                    <button onclick="excluirPaciente('${p.id}')">✕</button>
                </div>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Funções globais para os botões da lista
window.visualizarCronograma = (id) => {
    const p = pacientes.find(x => x.id === id);
    document.getElementById('placeholder').classList.add('hidden');
    document.getElementById('cronogramaContainer').classList.remove('hidden');
    document.getElementById('nomeDisplay').innerHTML = `<span class="text-blue-500 text-xs font-bold uppercase">${p.procedimento}</span><h2 class="text-xl font-bold">${p.nome}</h2>`;
    
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    const dataBase = new Date(p.data + 'T00:00:00');

    marcosModulares.forEach(m => {
        const dt = new Date(dataBase);
        dt.setDate(dataBase.getDate() + m.dias);
        timeline.innerHTML += `
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <span class="text-xs font-bold text-blue-500">${dt.toLocaleDateString('pt-BR')}</span>
                <h3 class="font-bold text-slate-700">${m.titulo}</h3>
                <p class="text-xs text-slate-500">${m.desc}</p>
            </div>`;
    });
    document.getElementById('btnZap').onclick = () => exportarZap(p);
};

window.prepararEdicao = (id) => {
    const p = pacientes.find(x => x.id === id);
    document.getElementById('pacienteNome').value = p.nome;
    document.getElementById('pacienteProcedimento').value = p.procedimento;
    document.getElementById('dataCirurgia').value = p.data;
    document.getElementById('editId').value = p.id;
    document.getElementById('formTitle').innerText = "Editando Paciente";
};

window.excluirPaciente = async (id) => {
    if(confirm("Excluir paciente?")) await deleteDoc(doc(db, "pacientes", id));
};

function exportarZap(p) {
    let msg = `*PLANO: ${p.nome.toUpperCase()}*\nProc: ${p.procedimento}\n\n`;
    const dataBase = new Date(p.data + 'T00:00:00');
    marcosModulares.forEach(m => {
        const dt = new Date(dataBase);
        dt.setDate(dataBase.getDate() + m.dias);
        msg += `✅ *${dt.toLocaleDateString('pt-BR')}* - ${m.titulo}\n`;
    });
    navigator.clipboard.writeText(msg).then(() => alert("Copiado para o WhatsApp!"));
}

window.filtrarPacientes = () => {
    const termo = document.getElementById('buscaPaciente').value.toLowerCase();
    const cards = document.querySelectorAll('#listaPacientes > div');
    cards.forEach(c => c.style.display = c.innerText.toLowerCase().includes(termo) ? '' : 'none');
};
document.getElementById('buscaPaciente').onkeyup = window.filtrarPacientes;
