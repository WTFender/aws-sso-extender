<template>
  <pre>{{ data }}</pre>
</template>

<script>
import extension from '../extension';

export default {
  name: 'DevtoolsView',
  data() {
    return {
      data: {},
    };
  },
  created() {
    extension.loadData().then((data) => {
      this.data = JSON.stringify(data, null, 2);
    });
  },
};
</script>
