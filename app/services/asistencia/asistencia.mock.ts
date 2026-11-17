import type {
  Asistencia,
  ConsultarCheckInResponse,
  QrEspacioEmitido,
} from "./types";

const qrMockPorEspacio = new Map<number, QrEspacioEmitido>();

function generarTokenBase64url(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let token = "";
  for (let i = 0; i < 43; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generarSvgMock(texto: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#ffffff" />
  <rect x="20" y="20" width="60" height="60" fill="#1b251e" rx="4" />
  <rect x="30" y="30" width="40" height="40" fill="#ffffff" rx="2" />
  <rect x="40" y="40" width="20" height="20" fill="#1b251e" rx="2" />
  <rect x="120" y="20" width="60" height="60" fill="#1b251e" rx="4" />
  <rect x="130" y="30" width="40" height="40" fill="#ffffff" rx="2" />
  <rect x="140" y="40" width="20" height="20" fill="#1b251e" rx="2" />
  <rect x="20" y="120" width="60" height="60" fill="#1b251e" rx="4" />
  <rect x="30" y="130" width="40" height="40" fill="#ffffff" rx="2" />
  <rect x="40" y="140" width="20" height="20" fill="#1b251e" rx="2" />
  <rect x="95" y="30" width="10" height="50" fill="#1b251e" />
  <rect x="30" y="95" width="50" height="10" fill="#1b251e" />
  <rect x="95" y="95" width="20" height="20" fill="#1b251e" />
  <rect x="125" y="95" width="55" height="15" fill="#1b251e" />
  <rect x="95" y="125" width="15" height="55" fill="#1b251e" />
  <rect x="125" y="125" width="55" height="55" fill="#1b251e" rx="4" />
  <rect x="135" y="135" width="35" height="35" fill="#ffffff" rx="2" />
  <rect x="145" y="145" width="15" height="15" fill="#1b251e" rx="1" />
  <text x="100" y="195" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#666666">${texto}</text>
</svg>`;
}

export async function consultarCheckIn(
  tokenQr: string,
): Promise<ConsultarCheckInResponse> {
  await new Promise((r) => setTimeout(r, 200));
  if (!tokenQr || !/^[A-Za-z0-9_-]{43}$/.test(tokenQr)) {
    const err = new Error("QR inválido o revocado");
    (err as { status?: number }).status = 404;
    throw err;
  }

  // Buscar espacio correspondiente o usar espacio 1 por defecto
  let recursoId = 1;
  for (const [espId, qr] of qrMockPorEspacio.entries()) {
    if (qr.tokenQr === tokenQr) {
      recursoId = espId;
      break;
    }
  }

  const ahora = new Date();
  return {
    recursoId,
    reservas: [
      {
        id: 101,
        estado: "EN_CURSO",
        fechaLimiteCheckIn: new Date(
          ahora.getTime() + 15 * 60000,
        ).toISOString(),
        fechaHoraCheckIn: null,
        origenCheckIn: null,
        checkInRegistradoPorId: null,
      },
    ],
  };
}

export async function registrarCheckIn(
  reservaId: number,
  _tokenQr: string,
): Promise<Asistencia> {
  await new Promise((r) => setTimeout(r, 200));
  const ahora = new Date();
  return {
    id: reservaId,
    estado: "EN_CURSO",
    fechaLimiteCheckIn: new Date(ahora.getTime() + 15 * 60000).toISOString(),
    fechaHoraCheckIn: ahora.toISOString(),
    origenCheckIn: "QR",
    checkInRegistradoPorId: 1,
  };
}

export async function registrarCheckInManual(
  reservaId: number,
): Promise<Asistencia> {
  await new Promise((r) => setTimeout(r, 200));
  const ahora = new Date();
  return {
    id: reservaId,
    estado: "EN_CURSO",
    fechaLimiteCheckIn: new Date(ahora.getTime() + 15 * 60000).toISOString(),
    fechaHoraCheckIn: ahora.toISOString(),
    origenCheckIn: "ADMIN",
    checkInRegistradoPorId: 99,
  };
}

export async function finalizarReserva(
  _reservaId: number,
  _observacion?: string,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}

export async function emitirQrEspacio(
  espacioId: number,
): Promise<QrEspacioEmitido> {
  await new Promise((r) => setTimeout(r, 200));
  const tokenQr = generarTokenBase64url();
  const url = `http://localhost:5000/asistencia#tokenQr=${tokenQr}`;
  const emitido: QrEspacioEmitido = {
    id: Date.now(),
    recursoId: espacioId,
    fechaCreacion: new Date().toISOString(),
    tokenQr,
    url,
    qrSvg: generarSvgMock(`SALA ${espacioId}`),
  };
  qrMockPorEspacio.set(espacioId, emitido);
  return emitido;
}

export async function revocarQrEspacio(espacioId: number): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  qrMockPorEspacio.delete(espacioId);
}
