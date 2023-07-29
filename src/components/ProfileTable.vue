<!-- eslint-disable vue/no-mutating-props -->
<!-- eslint-disable vue/max-len -->
<template>
  <!--- profile editor popup --->
  <PDialog
    v-model:visible="editorVisible"
    header="Edit Profile"
    :style="{ width: '500px' }"
  >
    <PScrollPanel class="scroll" style="max-width: 100%; max-height: 300px">
      <form style="margin-left: 10px">
        <div style="margin-bottom: 10px">
          <small id="profile-label-help">Profile Name</small>
          <InputText
            v-model="activeProfile.profile.name"
            class="p-inputtext-sm"
            aria-describedby="profile-label-help"
            style="width: 400px"
            :disabled="true"
          />
        </div>
        <small id="label-help">
          {{
            activeProfile.applicationName === "AWS Account"
              ? "Profile Label & Color"
              : "Profile Label"
          }}
        </small>
        <div style="margin-bottom: 10px">
          <InputText
            id="profileLabel"
            v-model="activeProfile.profile.custom!.label"
            class="p-inputtext-sm"
            style="width: 250px; margin-right: 10px"
            aria-describedby="label-help"
            :placeholder="activeProfile.profile.name"
          />
          <ColorPicker
            v-if="activeProfile.applicationName === 'AWS Account'"
            v-model="activeProfile.profile.custom!.color"
            @click="colorPickerVisible = !colorPickerVisible"
          />
          <InputText
            v-if="activeProfile.applicationName === 'AWS Account'"
            v-model="activeProfile.profile.custom!.color"
            class="p-inputtext-sm"
            style="width: 100px; margin-left: 10px"
          />
          <!--- Colorpicker popup doesn't work, create our own --->
          <PDialog
            v-if="$ext.platform === 'firefox' || $ext.platform === 'safari'"
            v-model:visible="colorPickerVisible"
            :style="{ width: '50vw' }"
          >
            <ColorPicker v-if="colorPickerVisible" v-model="activeProfile.profile.custom!.color" :inline="true" />
          </PDialog>
        </div>
        <div
          v-if="activeProfile.applicationName === 'AWS Account' && (!permissions.console || !permissions.signin)"
          style="text-align: center; padding-top: 20px;"
        >
          <PrimeButton
            size="small"
            icon="pi pi-lock"
            class="p-button-success"
            label="Request Permissions"
            style="margin-top: 5px"
            @click="requestPermissions()"
          />
          <p style="margin-top: 10px;">
            In order to customize the AWS console and assume IAM roles, this extension requires additional permissions.
          </p>
        </div>
        <div v-else-if="activeProfile.applicationName === 'AWS Account'">
          <div style="margin-bottom: 10px">
            <small id="account-label-help">AWS Account ID</small>
            <InputText
              v-model="activeProfile.searchMetadata!.AccountId"
              class="p-inputtext-sm"
              aria-describedby="account-label-help"
              style="width: 400px"
              :disabled="true"
            />
          </div>
          <div style="margin-bottom: 10px">
            <small id="account-name-label-help">AWS Account Name</small>
            <InputText
              v-model="activeProfile.searchMetadata!.AccountName"
              class="p-inputtext-sm"
              aria-describedby="account-name-label-help"
              style="width: 400px"
              :disabled="true"
            />
          </div>
          <div
            style="margin-bottom: 10px"
          >
            <small id="profile-label-help">AWS Console Preview</small>
            <InputText
              id="consolePreview"
              v-model="consolePreview"
              class="p-inputtext-sm"
              aria-describedby="profile-label-help"
              style="width: 400px"
              :disabled="true"
              :style="consoleStyle"
            />
          </div>
        </div>
        <div>
          <h3 v-if="activeProfile.profile.custom!.iamRoles.length > 0">
            IAM Roles
          </h3>
          <PBadge
            v-for="(role, idx) in activeProfile.profile.custom!.iamRoles"
            :key="idx"
            :value="role.label || role.roleName"
            class="role-link remove-role-link"
            :style="{ margin: '5px', 'background-color': `#${role.color}` }"
            icon="pi pi-times"
          >
            {{ role.label || role.roleName }}
            <i
              class="pi pi-times"
              style="font-size: 0.5rem"
              @click="removeIamRole(role, activeProfile)"
            />
          </PBadge>
        </div>
      </form>
    </PScrollPanel>
    <template #footer>
      <PrimeButton label="Save" icon="pi pi-save" @click="saveActiveProfile()" />
      <p ref="profileError" style="color: red; display: none">
        Unable to save Profile.
      </p>
    </template>
  </PDialog>

  <!--- profile table filters--->
  <div v-if="tableEditor">
    <PrimeButton
      size="small"
      :icon="sortAppIcon"
      class="filter-button"
      :class="tableSettings.sortApp !== false ? 'p-button-primary' : 'p-button-secondary'"
      label="App"
      @click="sortByApp()"
    />
    <PrimeButton
      size="small"
      :icon="sortProfileIcon"
      class="filter-button"
      :class="tableSettings.sortProfile !== false ? 'p-button-primary' : 'p-button-secondary'"
      label="Profile"
      @click="sortByProfile()"
    />
    <PCheckbox
      v-model="tableSettings.showIcon"
      input-id="showIcon"
      name="showIcon"
      :binary="true"
    />
    <label for="showIcon" class="setting-label">Icon</label>
    <PCheckbox
      v-model="tableSettings.showAppName"
      input-id="showAppName"
      name="showAppName"
      :binary="true"
    />
    <label for="showAppName" class="setting-label">Group By App</label>
    <PCheckbox
      v-model="tableSettings.sortCustom"
      input-id="sortCustom"
      name="sortCustom"
      :binary="true"
    />
    <label for="sortCustom" class="setting-label">Custom Sort</label>
  </div>

  <!--- profile table --->
  <div v-sortable="{ disabled: !tableEditor, options: { animation: 250, easing: 'cubic-bezier(1, 0, 0, 1)' } }" @ready="onReady" @end="onOrderChange">
    <div
      v-for="profile in sortedProfiles"
      :key="`${profile.id}-${profile.profile.id}`"
      class="profile"
    >
      <img
        v-if="tableSettings.showIcon"
        :alt="profile.name"
        :src="profile.icon"
        width="96"
        style="vertical-align: middle"
      />
      <p>{{ profile.sortName }}</p>
      <p>{{ profile.name }}</p>
      <p>{{ profile.profile.name }}</p>
      <p>{{ profile.applicationName }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import {
  AppData, ExtensionSettings, IamRole, UserData,
} from '../types';
import { getFontColor, waitForElement } from '../utils';

export default {
  name: 'ProfileTable',
  props: {
    tableEditor: {
      type: Boolean,
      default: false,
    },
    // eslint-disable-next-line vue/require-prop-types
    activeProfile: {
      // suppress ts errors, unsure why this is required
      required: false,
      default: () => ({} as AppData),
    },
    permissions: {
      type: Object,
      required: true,
    },
    search: {
      type: String,
      required: true,
    },
    user: {
      required: true,
      type: Object,
      default: () => ({} as UserData),
    },
    appProfiles: {
      type: Array as () => AppData[],
      required: true,
    },
    settings: {
      required: true,
      type: Object,
      default: () => ({} as ExtensionSettings),
    },
    demoMode: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['updateProfile', 'requestPermissions'],
  data() {
    return {
      tableSettings: {
        showIcon: true,
        showAppName: true,
        sortCustom: false,
        sortApp: 'desc' as false | 'asc' | 'desc' | 'ascNum' | 'descNum',
        sortProfile: false as false | 'asc' | 'desc',
      },
      // eslint-disable-next-line vue/no-dupe-keys
      activeProfile: {} as AppData,
      colorPickerVisible: false,
      editorVisible: false,
      searchableFields: [
        'id',
        'applicationId',
        'description',
        'profile.custom.label',
        'profile.id',
        'profile.description',
        'profile.protocol',
      ],
      selectedProfile: null,
      sourceProfile: {} as AppData,
    };
  },
  computed: {
    sortedProfiles() {
      const profiles: AppData[] = [];
      this.appProfiles.forEach((profile) => {
        if (profile.applicationName === 'AWS Account') {
          profile.sortName = profile.searchMetadata!.AccountName;
        }
        profile.sortName = profile.name;
        if (profile.name.toLowerCase().includes(this.search.toLowerCase())
          || profile.profile.name.toLowerCase().includes(this.search.toLowerCase())) {
          profiles.push(profile);
        }
      });
      // sort app name
      if (this.tableSettings.sortApp === 'desc') {
        profiles.sort((a, b) => a.name.localeCompare(b.name));
      } else if (this.tableSettings.sortApp === 'asc') {
        profiles.sort((a, b) => b.name.localeCompare(a.name));
      }
      // sort profile name
      if (this.tableSettings.sortProfile === 'asc') {
        profiles.sort((a, b) => b.profile.name.localeCompare(a.profile.name));
      } else if (this.tableSettings.sortProfile === 'desc') {
        profiles.sort((a, b) => a.profile.name.localeCompare(b.profile.name));
      }
      return profiles;
    },
    sortAppIcon() {
      return this.sortIcon(this.tableSettings.sortApp);
    },
    sortProfileIcon() {
      return this.sortIcon(this.tableSettings.sortProfile);
    },
    consoleStyle() {
      return {
        'background-color': `#${this.activeProfile.profile.custom!.color}`,
        color: getFontColor(this.activeProfile.profile.custom!.color),
      };
    },
    consolePreview() {
      return this.$ext.buildLabel(
        this.user.custom.sessionLabelSso,
        this.user.subject,
        this.activeProfile.profile.custom!.label || this.activeProfile.profile.name,
        null,
        this.activeProfile.searchMetadata!.AccountId,
        this.activeProfile.searchMetadata!.AccountName,
      );
    },
  },
  watch: {
    'tableSettings.sortCustom': {
      handler(v) {
        if (v === true) {
          this.tableSettings.sortApp = false;
          this.tableSettings.sortProfile = false;
        }
      },
    },
  },
  methods: {
    sortIcon(sort) {
      if (sort === 'desc') {
        return 'pi pi-sort-alpha-down';
      } if (sort === 'asc') {
        return 'pi pi-sort-alpha-down-alt';
      } if (sort === 'descNum') {
        return 'pi pi-sort-numeric-down';
      } if (sort === 'ascNum') {
        return 'pi pi-sort-numeric-down-alt';
      }
      return 'pi pi-sort-alt-slash';
    },
    sortByApp() {
      this.tableSettings.sortProfile = false;
      if (this.tableSettings.sortApp === false) {
        this.tableSettings.sortApp = 'desc';
      } else if (this.tableSettings.sortApp === 'desc') {
        this.tableSettings.sortApp = 'asc';
      } else if (this.tableSettings.sortApp === 'asc') {
        this.tableSettings.sortApp = 'descNum';
      } else if (this.tableSettings.sortApp === 'descNum') {
        this.tableSettings.sortApp = 'ascNum';
      } else if (this.tableSettings.sortApp === 'ascNum') {
        this.tableSettings.sortApp = false;
      }
    },
    sortByProfile() {
      this.tableSettings.sortApp = false;
      if (this.tableSettings.sortProfile === false) {
        this.tableSettings.sortProfile = 'desc';
      } else if (this.tableSettings.sortProfile === 'desc') {
        this.tableSettings.sortProfile = 'asc';
      } else if (this.tableSettings.sortProfile === 'asc') {
        this.tableSettings.sortProfile = false;
      }
    },
    onReady(event) {
      this.$ext.log(event.sortable);
    },
    onOrderChange(event) {
      this.$ext.log(event.oldIndex);
      this.$ext.log(event.newIndex);
    },
    requestPermissions() {
      this.$emit('requestPermissions');
    },
    editProfile(profile) {
      // duplicate profile without references
      // eslint-disable-next-line vue/no-mutating-props
      this.activeProfile = JSON.parse(JSON.stringify(profile));
      this.sourceProfile = JSON.parse(JSON.stringify(profile));
      this.editorVisible = true;
      waitForElement('#profileLabel').then((profileLabel) => {
        profileLabel.focus();
      });
    },
    saveActiveProfile() {
      this.activeProfile.profile.custom!.color = this.activeProfile.profile.custom!.color.replace('#', '');
      this.$emit('updateProfile', this.activeProfile);
      this.editorVisible = false;
    },
    removeIamRole(iamRole: IamRole, appProfile: AppData) {
      this.$ext.log('removeIamRole');
      const iamRoles: IamRole[] = [];
      appProfile.profile.custom!.iamRoles.forEach((role) => {
        if (role.roleName !== iamRole.roleName
          || role.accountId !== iamRole.accountId
          || role.profileId !== iamRole.profileId) {
          iamRoles.push(role);
        }
      });
      appProfile.profile.custom!.iamRoles = iamRoles;
      this.$emit('updateProfile', appProfile);
    },
    setProfiles(profiles) {
      this.$ext.log('setProfiles');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      profiles.forEach((profile) => {

      });
      this.$ext.log(profiles);
    },
    assumeIamRole(iamRole, appProfile) {
      // TODO notify on silent failure switching role
      this.$ext.log('assumeIamRole');
      this.$ext.log(iamRole);
      if (this.demoMode) {
        window.open('about:blank', '_blank');
        return;
      }
      const { settings } = this;
      settings.lastProfileId = appProfile.profile.id;
      this.$ext.saveSettings(settings).then(() => {
        this.$ext.queueIamLogin(iamRole, appProfile).then(() => {
          const profileUrl = this.$ext.createProfileUrl(this.user, appProfile);
          window.open(profileUrl, '_blank');
        });
      });
    },
    navSelectedProfile() {
      const profileUrl = this.$ext.createProfileUrl(this.user, this.selectedProfile);
      window.open(profileUrl, '_blank');
    },
    encodeUriPlusParens(str) {
      return encodeURIComponent(str).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16)}`,
      );
    },
    fave(appProfile) {
      // TODO fix favorite issue for multi users
      appProfile.profile.custom.favorite = !appProfile.profile.custom.favorite;
      this.$emit('updateProfile', appProfile);
    },
  },
};
</script>

<style lang="scss" scoped>
.filter-button {
  padding: 2px !important;
  margin-left: 10px;
}
.profile {
  border: 1px solid red;
}
.sso-link {
  color: #495057;
  text-decoration: none;
  text-overflow: ellipsis;
  border-radius: 4pt;
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

.remove-role-link:hover {
  background-color: red !important;
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

.p-inputtext {
  padding: 5px !important;
}

#consolePreview {
  opacity: 1 !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
</style>
