<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <div class="card">
    <DataTable
      v-model:filters="filters2"
      class="p-datatable-sm"
      scroll-height="800px"
      :value="profiles"
      row-group-mode="rowspan"
      group-rows-by="name"
      sort-mode="single"
      sort-field="name"
      :sort-order="1"
      responsive-layout="scroll"
      state-storage="local"
      state-key="dt-state-demo-local2"
    >
      <template #header>
        <span
          class="p-input-icon-left"
          style="width: 100%"
        >
          <i class="pi pi-search" />
          <InputText
            v-model="filters1['global'].value"
            style="width: 100%"
            placeholder="Search Profiles"
          />
        </span>
      </template>
      <Column
        :style="{'min-width':'120px'}"
        header-style="display: none;"
        field="name"
        body-style="text-align: center;"
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
        :style="{'min-width':'220px'}"
        field="profile.name"
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
              {{ slotProps.data.profile.name }}</a>
          </div>
        </template>
      </Column>
      <Column
        :style="{'width':'20px'}"
        header-style="display: none;"
        body-class="sso-favorite"
      >
        <template #body="slotProps">
          <i
            class="pi"
            :class="{
              'pi-star-fill': slotProps.data.profile?.favorite,
              'pi-star': !slotProps.data.profile?.favorite
            }"
            @click="fave(slotProps)"
          />
        </template>
      </Column>
    </DataTable>
    <DataTable
      v-model:editingRows="editingRows"
      v-model:filters="filters1"
      edit-mode="row"
      class="p-datatable-sm"
      scroll-height="800px"
      :value="profiles"
      row-group-mode="rowspan"
      :group-rows-by="['name']"
      sort-mode="single"
      sort-field="name"
      :sort-order="-1"
      responsive-layout="scroll"
      state-storage="local"
      state-key="dt-state-demo-local"
      @row-edit-save="onRowEditSave"
    >
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
        :style="{'min-width':'220px'}"
        field="profile.name"
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
              {{ 'label' in slotProps.data.profile ? slotProps.data.profile.label : slotProps.data.profile.name }}</a>
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
        style="width:10%; min-width:8rem"
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
              'pi-star-fill': slotProps.data.profile?.favorite,
              'pi-star': !slotProps.data.profile?.favorite
            }"
            @click="fave(slotProps)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
  <br>
  {{ updatedAt }}
</template>
<script>
import { FilterMatchMode } from 'primevue/api';
import extension from '../extension';

export default {
  name: 'PopupView',
  data() {
    return {
      editingRows: [],
      favorites: [],
      filters1: {},
      profiles: [],
      user: {},
      updatedAt: null,
    };
  },
  created() {
    this.filters1 = {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      'profile.favorite': { value: false, matchMode: FilterMatchMode.EQUALS },
    };
    this.filters2 = {
      global: this.filters1.global,
      'profile.favorite': { value: true, matchMode: FilterMatchMode.EQUALS },
    };
    extension.loadData().then((data) => {
      this.updatedAt = new Date(data.updatedAt);
      this.user = data.user;
      this.profiles = this.parseProfiles(data);
    });
  },
  methods: {
    onRowEditSave(event) {
      const { newData } = event;
      if ('profile.name' in newData) {
        newData.profile.label = newData['profile.name'];
        delete newData['profile.name'];
      }
      this.profiles.forEach((profile, index) => {
        if (profile.profile.id === newData.profile.id) {
          this.profiles[index] = newData;
        }
      });
    },
    removeFave(event) {
      const faveProfiles = [];
      this.favorites.forEach((profile) => {
        if (profile.profile.id !== event.data.profile.id) {
          faveProfiles.push(profile);
        }
      });
      this.favorites = faveProfiles;
    },
    fave(event) {
      const faveProfile = event.data;
      if (faveProfile.profile?.favorite === true) {
        faveProfile.profile.favorite = false;
      } else {
        faveProfile.profile.favorite = true;
      }
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
    parseProfiles(data) {
      const rows = [];
      data.apps.forEach((app) => {
        app.profiles.forEach((profile) => {
          const appProfile = profile;
          if (!('favorite' in appProfile)) {
            appProfile.favorite = false;
          }
          rows.push({ ...app, profile: appProfile });
        });
      });
      return rows;
    },
  },
};
</script>

<style lang="scss" scoped>
.p-rowgroup-footer td {
    font-weight: 700;
}

::v-deep(.p-rowgroup-header) {
    span {
        font-weight: 700;
    }

    .p-row-toggler {
        vertical-align: middle;
        margin-right: .25rem;
    }
}
.card {
  min-width: 400px !important;
  min-height: 400px !important;
  display: inline-block;
}
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
}
.pi-star-fill {
  color: gold !important;
}
.pi-star-fill:hover {
  color: grey !important;
}
</style>
