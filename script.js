
const exámenes = {
    amga: {
        pc: {
            1: "examenes/amga/pc/PC1 2020.1.pdf",
            2: "examenes/amga/pc/PC2 2020.1.pdf"
        },
        pd: {
            1: "examenes/amga/pd/PD1 2020.1.pdf",
            2: "examenes/amga/pd/PD2 2020.1.pdf"
        },
        ex: {
            1: "examenes/amga/ex/EX1 2020.1.pdf",
            2: "examenes/amga/ex/EX2 2020.1.pdf"
        }
    }
};

document.getElementById("curso").addEventListener("change", actualizarNumeros);
document.getElementById("tipo").addEventListener("change", actualizarNumeros);

function actualizarNumeros() {
    const curso = document.getElementById("curso").value;
    const tipo = document.getElementById("tipo").value;
    const numeroSelect = document.getElementById("numero");

    // Limpiar opciones anteriores
    numeroSelect.innerHTML = "";

    // Agregar nuevas opciones según el curso y tipo seleccionado
    const examenesDelCurso = exámenes[curso][tipo];
    for (let numero in examenesDelCurso) {
        let option = document.createElement("option");
        option.value = numero;
        option.text = tipo.toUpperCase() + " " + numero;
        numeroSelect.appendChild(option);
    }
}

function mostrarExamen() {
    const curso = document.getElementById("curso").value;
    const tipo = document.getElementById("tipo").value;
    const numero = document.getElementById("numero").value;
    const examenPath = exámenes[curso][tipo][numero];

    const visor = document.getElementById("visor");
    visor.innerHTML = `<iframe src="${examenPath}" width="100%" height="600px"></iframe>`;
}

actualizarNumeros();
    