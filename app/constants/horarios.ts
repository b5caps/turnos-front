export const BLOQUE_MINUTOS = 15
export const APERTURA_MINUTOS = 10 * 60
export const CIERRE_MINUTOS = 22 * 60
const DIAS_HABILES = [1, 2, 3, 4, 5]

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function etiquetaDuracion(minutos: number) {
  if (minutos < 60) return `${minutos}m`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas}h${resto}m` : `${horas}h`
}

export function minutosAHora(minutos: number) {
  const horas = Math.floor(minutos / 60).toString().padStart(2, '0')
  const resto = (minutos % 60).toString().padStart(2, '0')
  return `${horas}:${resto}`
}

export function horaAMinutos(hora: string) {
  const [horas, minutos] = hora.split(':')
  return Number(horas) * 60 + Number(minutos)
}

export function generarBloques() {
  const bloques: string[] = []
  for (let minutos = APERTURA_MINUTOS; minutos < CIERRE_MINUTOS; minutos += BLOQUE_MINUTOS) {
    bloques.push(minutosAHora(minutos))
  }
  return bloques
}

function aFechaLocal(fecha: string) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio!, mes! - 1, dia!)
}

function aIso(fecha: Date) {
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const dia = fecha.getDate().toString().padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function hoyIso() {
  return aIso(new Date())
}

export function sumarDias(fecha: string, dias: number) {
  const referencia = aFechaLocal(fecha)
  referencia.setDate(referencia.getDate() + dias)
  return aIso(referencia)
}

export function esDiaHabil(fecha: string) {
  return DIAS_HABILES.includes(aFechaLocal(fecha).getDay())
}

export function formatearFechaLarga(fecha: string) {
  const referencia = aFechaLocal(fecha)
  return `${NOMBRES_DIA[referencia.getDay()]} ${referencia.getDate()} de ${NOMBRES_MES[referencia.getMonth()]}`
}
