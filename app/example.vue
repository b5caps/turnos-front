<script setup lang="ts">
const { $api } = useNuxtApp();

const { data: disp } = await $api.getApiRecursosDisponibilidadNotebooks({
    query: {
        fechaHoraInicio: "1990-06-24T00:00:00Z",
        fechaHoraFin: "2100-06-24T00:00:00Z",
    },
});
</script>

<template>
    <ul v-if="disp?.data">
        <li v-for="item in disp.data">
            <strong>{{ item.nombre }}:</strong> {{ item.cuposLibres }}
        </li>
    </ul>
</template>
