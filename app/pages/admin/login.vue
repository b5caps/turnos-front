<script setup lang="ts">
import { ref } from "vue";
import { iniciarSesionApi, limpiarToken } from "~/api/auth";
import { BOTON_PRIMARIO, CAMPO, ERROR, ETIQUETA } from "~/constants/estilos";

const usuario = ref("");
const password = ref("");
const enviando = ref(false);
const errorMessage = ref("");

async function ingresar() {
  errorMessage.value = "";
  const identificador = usuario.value.trim();

  if (!identificador || !password.value) {
    errorMessage.value = "Completá todos los campos.";
    return;
  }

  enviando.value = true;
  try {
    const data = await iniciarSesionApi(identificador, password.value);
    if (data.usuario?.rol !== "ADMIN") {
      limpiarToken();
      errorMessage.value = "Esta cuenta no tiene permisos de administración.";
      return;
    }
    await navigateTo("/admin");
  } catch (fallo) {
    errorMessage.value =
      fallo instanceof Error ? fallo.message : "Credenciales inválidas.";
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <main
    class="grid min-h-screen place-items-center bg-paper px-6 py-10 font-sans text-ink"
  >
    <section
      aria-labelledby="admin-login-titulo"
      class="w-[min(100%,400px)] animate-rise rounded-xl border border-line bg-white p-8 shadow-card max-tablet:p-6"
    >
      <img
        alt="UTN GREB"
        class="mb-6 h-8 w-auto object-contain"
        src="/Logo_GREB.jpg"
      />

      <h1 id="admin-login-titulo" class="m-0 text-2xl font-bold tracking-tight">
        Ingreso Administración
      </h1>

      <form class="grid gap-4" @submit.prevent="ingresar">
        <label :class="ETIQUETA">
          Correo o legajo
          <input
            v-model="usuario"
            autocomplete="username"
            :class="CAMPO"
            required
            type="text"
          />
        </label>
        <label :class="ETIQUETA">
          Contraseña
          <input
            v-model="password"
            autocomplete="current-password"
            :class="CAMPO"
            required
            type="password"
          />
        </label>

        <p v-if="errorMessage" :class="ERROR">{{ errorMessage }}</p>

        <button
          :class="[BOTON_PRIMARIO, 'mt-2 w-full']"
          :disabled="enviando"
          type="submit"
        >
          {{ enviando ? "Verificando..." : "Ingresar" }}
        </button>
      </form>
    </section>
  </main>
</template>
