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

    const dataBase = new Date(p.data + 'T00:00:00');

    marcosModulares.forEach(marco => {
        const dataMarco = new Date(dataBase);
        dataMarco.setDate(dataBase.getDate() + marco.dias); 
        
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
    const dataBase = new Date(p.data + 'T00:00:00');
    
    let textoMensagem = `*PLANO DE RECUPERAÇÃO: ${p.nome.toUpperCase()}*\n`;
    textoMensagem += `Data da Cirurgia: ${dataBase.toLocaleDateString('pt-BR')}\n`;
    textoMensagem += `------------------------------------------\n\n`;

    marcosModulares.forEach(marco => {
        const dataMarco = new Date(dataBase);
        dataMarco.setDate(dataBase.getDate() + marco.dias); 
        textoMensagem += `✅ *${dataMarco.toLocaleDateString('pt-BR')}*\n*${marco.titulo}*\n${marco.desc}\n\n`;
    });

    navigator.clipboard.writeText(textoMensagem).then(() => {
        alert("Copiado para o WhatsApp!");
    });
}
