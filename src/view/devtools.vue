<template>
  <p>Config</p>
  <json-viewer
    :value="$ext.config"
    :expand-depth="1"
    copyable
    sort
  />
  <p>Data</p>
  <json-viewer
    :value="data"
    :expand-depth="1"
    copyable
    sort
  />
</template>

<script>
export default {
  name: 'DevtoolsView',
  data() {
    return {
      data: {},
      dataStr: '',
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
