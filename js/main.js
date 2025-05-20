const cursoSelector = document.getElementById("curso");
const tipoSelector = document.getElementById("tipo");
const nivelSelector = document.getElementById("nivel");
const contenedorExamenes = document.getElementById("examenes");
const nuevoExamenBtn = document.getElementById("nuevoExamen");
const examenAnteriorBtn = document.getElementById("examenAnterior");
const zoomSelector = document.getElementById("zoom");
const tiempoExamenInput = document.getElementById("tiempoExamen");
const iniciarTemporizadorBtn = document.getElementById("iniciarTemporizador");
const detenerTemporizadorBtn = document.getElementById("detenerTemporizador");
const temporizadorDisplay = document.getElementById("temporizador");
const alarmaSonido = document.getElementById("alarmaSonido");
const body = document.body;

const examenManualSelector = document.getElementById("examenManual");
const mostrarExamenManualBtn = document.getElementById("mostrarExamenManual"); // Corregido el ID

let examenActualURL = null;
let examenAnteriorURL = null;
let temporizadorInterval;
let tiempoRestante;
let temporizadorActivo = false;
let examenesVistos = [];

function cargarNiveles() {
    const cursoSeleccionado = cursoSelector.value;
    const tipoSeleccionado = tipoSelector.value;

    nivelSelector.innerHTML = '<option value="">- Seleccione un nivel -</option>';

    if (examenes[cursoSeleccionado] && examenes[cursoSeleccionado][tipoSeleccionado]) {
        const niveles = Object.keys(examenes[cursoSeleccionado][tipoSeleccionado]);
        niveles.forEach(nivel => {
            const option = document.createElement("option");
            option.value = nivel;
            option.textContent = nivel;
            nivelSelector.appendChild(option);
        });
        nivelSelector.disabled = false;
    } else {
        nivelSelector.disabled = true;
    }

    contenedorExamenes.innerHTML = "";
    examenActualURL = null;
    examenAnteriorURL = null;
    examenAnteriorBtn.disabled = true;

    poblarSelectorExamenManual();
}

function mostrarPDFIntegrado(pdfURL, escala = 'ancho') {
    contenedorExamenes.innerHTML = "";

    pdfjsLib.getDocument(pdfURL).promise
        .then(pdf => {
            for (let i = 1; i <= pdf.numPages; i++) {
                pdf.getPage(i).then(page => {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    let viewport = page.getViewport({ scale: 1 });
                    let escalaFinal = 1;

                    if (escala === 'ancho') {
                        const anchoContenedor = contenedorExamenes.offsetWidth;
                        const escalaAncho = anchoContenedor / viewport.width;
                        escalaFinal = escalaAncho;

                        if (window.innerWidth < 768) {
                            escalaFinal = Math.max(escalaFinal, 1.5);
                        }
                    } else {
                        escalaFinal = parseFloat(escala);
                    }

                    viewport = page.getViewport({ scale: escalaFinal });
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.style.marginBottom = '20px';

                    contenedorExamenes.appendChild(canvas);

                    page.render({ canvasContext: context, viewport: viewport });
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar el PDF:", error);
            contenedorExamenes.innerHTML = `<p>Error al cargar el PDF: ${error}</p>`;
        });
}

function cargarExamenAleatorioPorNivel() {
    const cursoSeleccionado = cursoSelector.value;
    const tipoSeleccionado = tipoSelector.value;
    const nivelSeleccionado = nivelSelector.value;

    if (cursoSeleccionado && tipoSeleccionado && nivelSeleccionado &&
        examenes[cursoSeleccionado] &&
        examenes[cursoSeleccionado][tipoSeleccionado] &&
        examenes[cursoSeleccionado][tipoSeleccionado][nivelSeleccionado]) {

        const listaDeExamenes = examenes[cursoSeleccionado][tipoSeleccionado][nivelSeleccionado];

        if (listaDeExamenes.length > 0) {
            //  Mover la actualización de examenAnteriorURL antes de la selección aleatoria
            if (examenActualURL) {
                examenAnteriorURL = examenActualURL;
                examenAnteriorBtn.disabled = false;
            }

            const indiceAleatorio = Math.floor(Math.random() * listaDeExamenes.length);
            const examenAleatorio = listaDeExamenes[indiceAleatorio];
            const zoomNivel = zoomSelector.value;
            mostrarPDFIntegrado(examenAleatorio, zoomNivel);
            examenActualURL = examenAleatorio;
        } else {
            contenedorExamenes.innerHTML = "<p>No se encontraron exámenes para este nivel.</p>";
            examenActualURL = null;
            examenAnteriorURL = null;
            examenAnteriorBtn.disabled = true;
        }
    } else if (cursoSeleccionado && tipoSeleccionado && !nivelSeleccionado) {
        contenedorExamenes.innerHTML = "<p>Por favor, seleccione un nivel de examen.</p>";
        examenActualURL = null;
        examenAnteriorURL = null;
        examenAnteriorBtn.disabled = true;
    } else {
        contenedorExamenes.innerHTML = "<p>No se encontraron exámenes para esta selección.</p>";
        examenActualURL = null;
        examenAnteriorURL = null;
        examenAnteriorBtn.disabled = true;
    }
}

function generarNuevoExamen() {
    const nivelSeleccionado = nivelSelector.value;
    if (nivelSeleccionado) {
        cargarExamenAleatorioPorNivel();
    } else {
        alert("Por favor, seleccione un nivel antes de generar un nuevo examen.");
    }
}

function volverAlExamenAnterior() {
    if (examenAnteriorURL) {
        const tempURL = examenActualURL;
        const zoomNivel = zoomSelector.value;
        mostrarPDFIntegrado(examenAnteriorURL, zoomNivel);
        examenActualURL = examenAnteriorURL;
        examenAnteriorURL = tempURL;
        examenAnteriorBtn.disabled = (examenAnteriorURL === null);
    }
}

function iniciarTemporizadorExamen() {
    const tiempoTotalMinutos = parseInt(tiempoExamenInput.value, 10);
    if (isNaN(tiempoTotalMinutos) || tiempoTotalMinutos <= 0) {
        alert("Por favor, ingrese un tiempo válido en minutos.");
        return;
    }

    tiempoRestante = tiempoTotalMinutos * 60;
    clearInterval(temporizadorInterval);
    temporizadorInterval = setInterval(actualizarTemporizador, 1000);
    temporizadorDisplay.textContent = formatTiempo(tiempoRestante);
    temporizadorActivo = true;
}

function actualizarTemporizador() {
    if (!temporizadorActivo) {
        return;
    }

    tiempoRestante--;
    temporizadorDisplay.textContent = formatTiempo(tiempoRestante);

    if (tiempoRestante <= 0) {
        detenerTemporizador();
        temporizadorDisplay.textContent = "¡Tiempo terminado!";
        sonarAlarma();
    }
}

function detenerTemporizador() {
    clearInterval(temporizadorInterval);
    temporizadorActivo = false;
    temporizadorDisplay.textContent = formatTiempo(tiempoRestante);
    if (alarmaSonido) {
        alarmaSonido.pause();
        alarmaSonido.currentTime = 0;
    }
}

function formatTiempo(totalSegundos) {
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function sonarAlarma() {
    if (alarmaSonido) {
        alarmaSonido.play();
    } else {
        const alarmaSonido = document.getElementById("alarmaSonido");
        alarmaSonido.play();
    }
}

function poblarSelectorExamenManual() {
    examenManualSelector.innerHTML = '<option value="">- Seleccione un examen -</option>';
    const cursoSeleccionado = cursoSelector.value;
    const tipoSeleccionado = tipoSelector.value;
    const nivelSeleccionado = nivelSelector.value;

    if (cursoSeleccionado && tipoSeleccionado && nivelSeleccionado &&
        examenes[cursoSeleccionado] &&
        examenes[cursoSeleccionado][tipoSeleccionado] &&
        examenes[cursoSeleccionado][tipoSeleccionado][nivelSeleccionado]) {

        const listaDeExamenes = examenes[cursoSeleccionado][tipoSeleccionado][nivelSeleccionado];

        if (Array.isArray(listaDeExamenes)) {
            listaDeExamenes.forEach(examen => {
                const option = document.createElement("option");
                option.value = examen;
                const nombreArchivo = examen.split('/').pop();
                option.textContent = nombreArchivo;
                examenManualSelector.appendChild(option);
            });
        } else {
            console.error("Error: listaDeExamenes no es un array.", listaDeExamenes);
        }
        examenManualSelector.disabled = false;
    } else {
        examenManualSelector.disabled = true;
    }
}

function mostrarExamenSeleccionado() {
    const examenSeleccionadoURL = examenManualSelector.value;
    console.log("URL seleccionada:", examenSeleccionadoURL);
    if (examenSeleccionadoURL) {
        if (examenActualURL) {
            examenAnteriorURL = examenActualURL;
            examenAnteriorBtn.disabled = false;
        } else {
            examenAnteriorURL = null;
            examenAnteriorBtn.disabled = true;
        }
        const zoomNivel = zoomSelector.value;
        mostrarPDFIntegrado(examenSeleccionadoURL, zoomNivel);
        agregarExamenVisto(examenSeleccionadoURL);
        examenActualURL = examenSeleccionadoURL;
    }
}

function agregarExamenVisto(urlExamen) {
    if (!examenesVistos.includes(urlExamen)) {
        examenesVistos.push(urlExamen);
    }
    if (examenAnteriorURL) {
        examenAnteriorBtn.disabled = false;
    }
}

// Función para aplicar el modo oscuro
function aplicarModoOscuro(activar) {
    if (activar) {
        body.classList.add('modo-oscuro');
    } else {
        body.classList.remove('modo-oscuro');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Obtener el checkbox DENTRO del DOMContentLoaded
    const modoOscuroCheckbox = document.getElementById("modoOscuro");

    // Cargar el estado del modo oscuro desde localStorage
    const modoOscuroActivado = localStorage.getItem('modoOscuro') === 'true';

    // Establecer el estado inicial del checkbox y aplicar el modo oscuro
    modoOscuroCheckbox.checked = modoOscuroActivado;
    aplicarModoOscuro(modoOscuroActivado);

    // Event listener para el cambio del checkbox
    modoOscuroCheckbox.addEventListener('change', function() {
        const activar = this.checked;
        aplicarModoOscuro(activar);
        localStorage.setItem('modoOscuro', activar);
    });

    cargarNiveles(); // Cargar niveles al inicio

    cursoSelector.addEventListener("change", cargarNiveles);
    tipoSelector.addEventListener("change", cargarNiveles);
    nivelSelector.addEventListener("change", function() {
        cargarExamenAleatorioPorNivel();
        poblarSelectorExamenManual();
    });
    nuevoExamenBtn.addEventListener("click", generarNuevoExamen);
    examenAnteriorBtn.addEventListener("click", volverAlExamenAnterior);
    zoomSelector.addEventListener("change", () => {
        if (examenActualURL) {
            const zoomNivel = zoomSelector.value;
            mostrarPDFIntegrado(examenActualURL, zoomNivel);
        }
    });
    mostrarExamenManualBtn.addEventListener("click", mostrarExamenSeleccionado);
    iniciarTemporizadorBtn.addEventListener("click", iniciarTemporizadorExamen);
    detenerTemporizadorBtn.addEventListener("click", detenerTemporizador);
});

// Cargar los niveles iniciales
cargarNiveles();
