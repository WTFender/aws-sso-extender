<template>
  <pre>{{ data }}</pre>
</template>

<script>
import extension from "../extension";

export default {
  name: "devtoolsView",
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
