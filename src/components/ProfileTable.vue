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
    <PColumn
      header-style="display: none;"
      field="name"
      body-style="text-align: center;"
      :style="{ 'min-width': '120px' }"
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
    </PColumn>
    <PColumn
      field="applicationName"
      header-style="display: none;"
      body-class="display: none;"
    >
      <template #body="" />
    </PColumn>
    <PColumn
      field="profile.name"
      header-style="display: none;"
      body-class="display: none;"
    >
      <template #body="" />
    </PColumn>
    <PColumn
      :style="{ 'min-width': '220px' }"
      field="profile.custom.label"
      header-style="display: none;"
      body-class="sso-profile"
    >
      <template #body="slotProps">
        <div>
          <a
            class="sso-link"
            target="_blank"
            rel="noopener noreferrer"
            :href="$ext.createProfileUrl(user, slotProps.data)"
          ><i class="pi pi-external-link" />
            {{ label(slotProps.data) }}</a>
        </div>
        <div v-if="'iamRoles' in slotProps.data.profile.custom">
          <PBadge
            v-for="(role, idx) in slotProps.data.profile.custom.iamRoles"
            :key="idx"
            :value="role.label !== '' ? $ext.buildRoleLabel(role, slotProps.data) : `${role.roleName} @ ${role.accountId}`"
            class="role-link"
            :style="{margin: '5px', 'background-color': `#${role.color}`}"
            @click="assumeIamRole(role, slotProps.data)"
          />
        </div>
      </template>
      <template #editor="{ data, field }">
        <InputText
          v-model="data[field]"
        />
      </template>
    </PColumn>
    <PColumn
      :row-editor="true"
      body-style="text-align:center"
      header-style="display: none;"
    />
    <PColumn
      :style="{ width: '20px' }"
      header-style="display: none;"
      body-class="sso-favorite"
    >
      <template #body="slotProps">
        <i
          class="pi"
          :class="{
            'pi-star-fill': slotProps.data.profile.custom.favorite,
            'pi-star': !slotProps.data.profile.custom.favorite,
          }"
          @click="fave(slotProps)"
        />
      </template>
    </PColumn>
    <!--- Hidden searchable fields --->
    <PColumn
      v-for="field in ['id', 'applicationId', 'description', 'profile.custom.label', 'profile.id', 'profile.description', 'profile.protocol']"
      :field="field"
      style="display: none;"
      header-style="display: none;"
    />
    <PColumn
      :style="{ width: '10px' }"
      header-style="display: none;"
    />
  </DataTable>
</template>

<script lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { UserData } from '../types';

export default {
  name: 'ProfileTable',
  props: {
    user: {
      required: true,
      type: Object,
      default: () => ({} as UserData),
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
    this.filterProfiles = {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    };
  },
  mounted() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchBox = (this.$refs.searchBox as any).$el as HTMLElement;
    // searchBox.focus();
  },
  methods: {
    assumeIamRole(iamRole, appProfile) {
      // TODO notify on silent failure switching role
      this.$ext.queueIamLogin(iamRole).then(() => {
        const profileUrl = this.$ext.createProfileUrl(this.user, appProfile);
        window.open(profileUrl, '_blank');
      });
    },
    label(appProfile) {
      if (appProfile.profile.custom.label !== null) {
        return appProfile.profile.custom.label;
      }
      return appProfile.profile.name;
    },
    navSelectedProfile() {
      const profileUrl = this.$ext.createProfileUrl(this.user, this.selectedProfile);
      window.open(profileUrl, '_blank');
    },
    updateProfileLabel(event) {
      this.$emit('updateProfileLabel', event);
    },
    encodeUriPlusParens(str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
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
}
.sso-link:hover {
  color: #5e3add;
  cursor: pointer;
}
.role-link {
  white-space: nowrap;
  margin-right: 5px;
}
.role-link:hover {
  background-color: #5e3add !important;
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
