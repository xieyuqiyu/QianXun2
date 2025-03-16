<script setup>
import Header from './components/Header.vue'
import Search from './components/Search.vue'
import Card from './components/Card.vue'
import Chat from './components/Chat.vue'
import { ref } from 'vue'
const msg = ref('Hello Vue 3 + Vite')
</script>

<template>
  <Header />
  <Search />
  <Card />
  <Chat />
  <br>
  <br>
  <br>
  <br>
</template>

<style scoped></style>
