<template>
  <div class="main_app">
    <pre>{{data}}</pre>
  </div>
</template>

<script>
import extension from '../entry/extension';

export default {
  name: 'devtoolsView',
  created() {
    extension.loadData().then((data) => {
      this.data = JSON.stringify(data, null, 2);
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
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
