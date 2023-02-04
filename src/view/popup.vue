<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <div class="card">
    <h5>Expandable Row Groups</h5>
    <DataTable
      v-model:expandedRowGroups="expandedRowGroups"
      :value="profiles"
      row-group-mode="subheader"
      group-rows-by="applicationId"
      sort-mode="single"
      sort-field="applicationId"
      :sort-order="1"
      responsive-layout="scroll"
      :expandable-row-groups="true"
    >
      <Column
        header="SSO Applications"
      >
        <template #body="slotProps">
          <a
            target="_blank"
            :href="createUrl(slotProps.data)"
          >{{ slotProps.data.profile.name }}</a>
        </template>
      </Column>
      <template #groupheader="slotProps">
        <img
          :alt="slotProps.data.applicationId"
          src="icons/16.png"
          width="16"
          style="vertical-align: middle; margin-right: 10px; margin-left: 10px;"
        >
        <span>{{ `${slotProps.data.applicationId} - ${slotProps.data.applicationName}` }}</span>
      </template>
      <template #groupfooter="slotProps">
        <td
          colspan="4"
          style="text-align: right"
        >
          {{ slotProps.data.appId }}
        </td>
      </template>
    </DataTable>
  </div>
</template>
<script>
import extension from '../extension';

export default {
  name: 'PopupView',
  data() {
    return {
      data: {},
      expandedRowGroups: null,
      profiles: [],
      columns: [
        { field: 'appType', header: 'App Type' },
        { field: 'appName', header: 'App Name' },
        { field: 'appId', header: 'App ID', hidden: true },
        { field: 'profileName', header: 'Profile' },
        { field: 'profileUrl', header: 'Link', hidden: true },
      ],
    };
  },
  created() {
    extension.loadData().then((data) => {
      this.data = data;
      this.profiles = this.parseProfiles(data);
    });
  },
  methods: {
    encodeUriPlusParens(str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
    },
    createUrl(appProfile) {
      const ssoDirUrl = `https://${this.data.user.managedActiveDirectoryId}.awsapps.com/start/#/saml/custom`;
      const appProfilePath = this.encodeUriPlusParens(btoa(`${this.data.user.accountId}_${appProfile.id}_${appProfile.profile.id}`));
      const appProfileName = this.encodeUriPlusParens(appProfile.name);
      return `${ssoDirUrl}/${appProfileName}/${appProfilePath}`;
    },
    parseProfiles(data) {
      const rows = [];
      data.apps.forEach((app) => {
        app.profiles.forEach((profile) => {
          rows.push({ ...app, profile });
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
</style>
