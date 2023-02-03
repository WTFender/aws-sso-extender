<template>
  <div class="main_app">
    <h1>{{ JSON.stringify(data) }}</h1>
  </div>
</template>

<script>
import extension from "../extension";

export default {
  name: "popupView",
  created() {
    extension.loadData().then((data) => {
      this.data = data;
    });
  },
  data() {
    return {
      data: {},
    };
  },
};
</script>

<style>
.main_app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
