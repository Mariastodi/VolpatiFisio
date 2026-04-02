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
    signInWithEmailAndPassword(auth, email, senha).catch(e => alert("Erro ao entrar: " + e.message));
};

document.getElementById('btnLogout').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    const loading = document.getElementById('loadingScreen');
    const login = document.getElementById('loginSection');
    const appUi = document.getElementById('appContent');

    loading.classList.add('hidden');

    if (user) {
        login.classList.add('hidden');
        appUi.classList.remove('hidden');
        ouvirDados();
    } else {
        login.classList.remove('hidden');
        appUi.classList.add('hidden');
    }
});

function ouvirDados() {
    const q = query(collection(db, "pacientes"), orderBy("nome"));
    onSnapshot(q, (snapshot) => {
        pacientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarLista();
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
        await addDoc(collection(db, "pacientes"), { ...dados, notas: "", checks: {} });
    }
    limparCampos();
}

function limparCampos() {
    ['pacienteNome', 'pacienteProcedimento', 'dataCirurgia'].forEach(id => document.getElementById(id).value = "");
}

document.getElementById('btnSalvar').onclick = salvarPaciente;

function renderizarLista() {
    const lista = document.getElementById('listaPacientes');
    lista.innerHTML = '';
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    pacientes.forEach((p) => {
        const dataC = new Date(p.data + 'T00:00:00');
        const diff = Math.floor((hoje - dataC) / (1000 * 60 * 60 * 24));
        const badge = diff >= 60 ? `<span class="bg-orange-100 text-orange-600 text-[9px] font-bold px-2 py-0.5 rounded-full ml-1">60 DIAS+</span>` : '';

        const div = document.createElement('div');
        div.className = "p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-400 cursor-pointer shadow-sm transition-all";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div onclick="visualizarCronograma('${p.id}')" class="flex-grow">
                    <p class="font-bold text-slate-700 text-sm">${p.nome} ${badge}</p>
                    <p class="text-[11px] text-slate-400 font-medium uppercase">${p.procedimento || 'FISIOTERAPIA'}</p>
                </div>
                <div class="flex gap-3 text-slate-300 ml-2">
                    <button onclick="prepararEdicao('${p.id}')" class="hover:text-blue-500">✎</button>
                    <button onclick="excluirPaciente('${p.id}')" class="hover:text-red-500">✕</button>
                </div>
            </div>`;
        lista.appendChild(div);
    });
}

window.visualizarCronograma = (id) => {
    const p = pacientes.find(x => x.id === id);
    document.getElementById('placeholder').classList.add('hidden');
    document.getElementById('cronogramaContainer').classList.remove('hidden');
    
    document.getElementById('nomeDisplay').innerHTML = `
        <span class="text-blue-500 text-[10px] font-bold uppercase tracking-widest">${p.procedimento || 'FISIOTERAPIA'}</span>
        <h2 class="text-2xl font-black text-slate-800">${p.nome}</h2>
    `;
    
    const notasField = document.getElementById('notasRapidas');
    notasField.value = p.notas || "";
    notasField.onblur = async () => await updateDoc(doc(db, "pacientes", p.id), { notas: notasField.value });

    const checkContainer = document.getElementById('checklistEnvios');
    checkContainer.innerHTML = '';
    const itensNecessarios = ["Apresentação", "Vídeo Curativo", "Vídeo Mobilidade", "Vídeo Fortalecimento", "Orientação Carga"];
    
    itensNecessarios.forEach(item => {
        const isChecked = p.checks && p.checks[item] ? 'checked' : '';
        checkContainer.innerHTML += `
            <label class="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <input type="checkbox" ${isChecked} onchange="toggleCheck('${p.id}', '${item}', this.checked)" class="w-4 h-4 accent-blue-600">
                <span class="text-sm ${isChecked ? 'line-through text-slate-400' : 'text-slate-600 font-medium'}">${item}</span>
            </label>
        `;
    });

    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    const dataBase = new Date(p.data + 'T00:00:00');

    marcosModulares.forEach(m => {
        const dt = new Date(dataBase);
        dt.setDate(dataBase.getDate() + m.dias);
        const dataFormatada = dt.toLocaleDateString('pt-BR');
        
        const gDate = dt.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];
        const gUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.titulo + ': ' + p.nome)}&dates=${gDate}/${gDate}&details=${encodeURIComponent(m.desc)}&sf=true&output=xml`;

        timeline.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                <div>
                    <p class="text-blue-600 font-bold text-xs">${dataFormatada}</p>
                    <h3 class="font-bold text-slate-800 my-1">${m.titulo}</h3>
                    <p class="text-[11px] text-slate-500">${m.desc}</p>
                </div>
                <a href="${gUrl}" target="_blank" title="Adicionar ao Google Agenda" class="bg-slate-50 hover:bg-blue-100 p-2.5 rounded-full transition-colors">
                    📅
                </a>
            </div>`;
    });

    document.getElementById('btnZap').onclick = () => {
        let msg = `*CRONOGRAMA PÓS-OP: ${p.nome.toUpperCase()}*\n\n`;
        marcosModulares.forEach(m => {
            const dt = new Date(dataBase);
            dt.setDate(dataBase.getDate() + m.dias);
            msg += `✅ *${dt.toLocaleDateString('pt-BR')}* - ${m.titulo}\n`;
        });
        navigator.clipboard.writeText(msg).then(() => alert("Cronograma copiado! Basta colar no WhatsApp."));
    };
};

window.toggleCheck = async (id, item, status) => {
    const p = pacientes.find(x => x.id === id);
    const novosChecks = { ...(p.checks || {}) };
    novosChecks[item] = status;
    await updateDoc(doc(db, "pacientes", id), { checks: novosChecks });
};

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
    if(confirm("Deseja realmente excluir este paciente?")) await deleteDoc(doc(db, "pacientes", id));
};

document.getElementById('buscaPaciente').onkeyup = () => {
    const termo = document.getElementById('buscaPaciente').value.toLowerCase();
    document.querySelectorAll('#listaPacientes > div').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(termo) ? '' : 'none';
    });
};
