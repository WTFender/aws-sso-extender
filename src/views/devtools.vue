<template>
  <p>Config</p>
  <pre>{{ $ext.config }}</pre>
  <p>Data</p>
  <pre>{{ data }}</pre>
</template>

<script lang="ts">
export default {
  name: 'DevtoolsView',
  data() {
    return {
      data: {},
      dataStr: '',
      configStr: '',
    };
  },
  created() {
    this.configStr = JSON.stringify(this.$ext.config, null, 2);
    this.$ext.loadData().then((data) => {
      this.data = data;
      this.dataStr = JSON.stringify(data, null, 2);
    });
  },
};
</script>
