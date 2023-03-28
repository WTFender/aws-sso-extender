<!-- eslint-disable max-len -->
<template>
  <DataTable
    v-model:editingRows="editingRows"
    v-model:filters="filterProfiles"
    v-model:selection="selectedProfile"
    selection-mode="single"
    edit-mode="row"
    class="p-datatable-sm"
    scroll-height="400px"
    :value="appProfiles"
    row-group-mode="rowspan"
    :group-rows-by="['name']"
    sort-field="name"
    responsive-layout="scroll"
    @row-edit-save="updateProfileLabel"
    @keydown.enter="navSelectedProfile()"
  >
    <template #header>
      <span
        class="p-input-icon-left"
        style="width: 90%;"
      >
        <i
          class="pi pi-search"
        />
        <InputText
          ref="searchBox"
          v-model="filterProfiles['global'].value"
          style="width: 80%;"
          placeholder="Search Profiles"
        />
      </span>
    </template>
    <Column
      header-style="display: none;"
      field="name"
      body-style="text-align: center;"
      :style="{'min-width':'120px'}"
    >
      <template #body="slotProps">
        <div>
          <img
            :alt="slotProps.data.profile.name"
            :src="slotProps.data.icon"
            width="96"
            style="vertical-align: middle"
          >
          <br>
          <span
            v-if="slotProps.data.applicationName !== 'AWS Account'"
          >{{ slotProps.data.name }}</span>
          <div v-else>
            <span>{{ slotProps.data.searchMetadata.AccountName }}</span><br>
            <span style="font-size: .8rem">{{ slotProps.data.searchMetadata.AccountId }}</span>
          </div>
        </div>
      </template>
    </Column>
    <Column
      field="applicationName"
      header-style="display: none;"
      body-class="display: none;"
    >
      <template #body="" />
    </Column>
    <Column
      field="profile.name"
      header-style="display: none;"
      body-class="display: none;"
    >
      <template #body="" />
    </Column>
    <Column
      :style="{'min-width':'220px'}"
      field="profile.custom.label"
      header-style="display: none;"
      body-class="sso-profile"
    >
      <template #body="slotProps">
        <div>
          <a
            class="sso-link"
            target="_blank"
            :href="createUrl(slotProps.data)"
          ><i class="pi pi-external-link" />
            {{ slotProps.data.profile.custom.label !== null ? slotProps.data.profile.custom.label : slotProps.data.profile.name }}</a>
        </div>
      </template>
      <template #editor="{ data, field }">
        <InputText
          v-model="data[field]"
          autofocus
        />
      </template>
    </Column>
    <Column
      :row-editor="true"
      body-style="text-align:center"
      header-style="display: none;"
    />
    <Column
      :style="{'width':'20px'}"
      header-style="display: none;"
      body-class="sso-favorite"
    >
      <template #body="slotProps">
        <i
          class="pi"
          :class="{
            'pi-star-fill': slotProps.data.profile.custom.favorite,
            'pi-star': !slotProps.data.profile.custom.favorite
          }"
          @click="fave(slotProps)"
        />
      </template>
    </Column>
    <Column
      :style="{'width':'10px'}"
      header-style="display: none;"
    />
  </DataTable>
</template>

<script>
import { FilterMatchMode } from 'primevue/api';

export default {
  name: 'ProfileTable',
  props: {
    user: {
      type: Object,
      required: true,
    },
    appProfiles: {
      type: Array,
      required: true,
    },
  },
  emits: ['updateProfileLabel', 'updateProfile'],
  data() {
    return {
      selectedProfile: null,
      editingRows: [],
      filterProfiles: {},
    };
  },
  created() {
    // eslint-disable-next-line no-console
    this.filterProfiles = {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    };
  },
  mounted() {
    this.$refs.searchBox.$el.focus();
  },
  methods: {
    navSelectedProfile() {
      const profileUrl = this.createUrl(this.selectedProfile);
      window.open(profileUrl, '_blank');
    },
    updateProfileLabel(event) {
      this.$emit('updateProfileLabel', event);
    },
    encodeUriPlusParens(str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
    },
    createUrl(appProfile) {
      const ssoDirUrl = `https://${this.user.managedActiveDirectoryId}.awsapps.com/start/#/saml/custom`;
      const appProfilePath = this.encodeUriPlusParens(btoa(`${this.user.accountId}_${appProfile.id}_${appProfile.profile.id}`));
      const appProfileName = this.encodeUriPlusParens(appProfile.name);
      return `${ssoDirUrl}/${appProfileName}/${appProfilePath}`;
    },
    fave(event) {
      // TODO fix favorite issue for multi users
      const appProfile = event.data;
      appProfile.profile.custom.favorite = !appProfile.profile.custom.favorite;
      this.$emit('updateProfile', appProfile);
    },
  },
};
</script>

<style lang="scss" scoped>
.sso-link {
  color: #495057;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 5px;
}
.sso-link:hover {
  color: #5e3add;
  cursor: pointer;
}
.pi-star:hover {
  color: gold !important;
  cursor: pointer;
}
.pi-star-fill {
  color: gold !important;
}
.pi-star-fill:hover {
  color: grey !important;
  cursor: pointer;
}
</style>
