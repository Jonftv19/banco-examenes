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
const alarmaSonido = document.getElementById("alarmaSonido"); // Obtener referencia al audio
const modoOscuroCheckbox = document.getElementById("modoOscuro"); // ¡Esta línea faltaba!
const body = document.body;

let examenActualURL = null;
let examenAnteriorURL = null;
let temporizadorInterval;
let tiempoRestante;
let temporizadorActivo = false;

function cargarNiveles() {
  const cursoSeleccionado = cursoSelector.value;
  const tipoSeleccionado = tipoSelector.value;

  nivelSelector.innerHTML = '<option value="">-- Seleccione un nivel --</option>';

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
                
                        // Ajuste para dispositivos móviles (considerando devicePixelRatio)
                        if (window.innerWidth < 768) {
                            escalaFinal = Math.max(escalaFinal, 1.5 * window.devicePixelRatio);
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
  cargarExamenAleatorioPorNivel();
}

function volverAlExamenAnterior() {
  if (examenAnteriorURL) {
      const tempURL = examenActualURL;
      const zoomNivel = zoomSelector.value;
      mostrarPDFIntegrado(examenAnteriorURL, zoomNivel);
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

  tiempoRestante = tiempoTotalMinutos * 60; // Convertir a segundos
  clearInterval(temporizadorInterval); // Limpiar cualquier temporizador anterior
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
  temporizadorDisplay.textContent = formatTiempo(tiempoRestante); // Mostrar el tiempo restante al detener
  if (alarmaSonido) {
      alarmaSonido.pause();
      alarmaSonido.currentTime = 0; // Reiniciar el sonido si se detiene antes de terminar
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


function toggleModoOscuro() {
    body.classList.toggle('modo-oscuro');
    localStorage.setItem('modoOscuro', body.classList.contains('modo-oscuro'));
}

// Event listener para el checkbox del modo oscuro
modoOscuroCheckbox.addEventListener('change', toggleModoOscuro);

// Comprobar la preferencia del usuario al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('modoOscuro') === 'true') {
      modoOscuroCheckbox.checked = true;
      toggleModoOscuro();
  }
});

// Event listeners
iniciarTemporizadorBtn.addEventListener("click", iniciarTemporizadorExamen);
detenerTemporizadorBtn.addEventListener("click", detenerTemporizador);
cursoSelector.addEventListener("change", cargarNiveles);
tipoSelector.addEventListener("change", cargarNiveles);
nivelSelector.addEventListener("change", cargarExamenAleatorioPorNivel);
nuevoExamenBtn.addEventListener("click", generarNuevoExamen);
examenAnteriorBtn.addEventListener("click", volverAlExamenAnterior);
zoomSelector.addEventListener("change", () => {
    if (examenActualURL) {
        const zoomNivel = zoomSelector.value;
        mostrarPDFIntegrado(examenActualURL, zoomNivel);
    }
});

// Cargar los niveles iniciales
cargarNiveles();
