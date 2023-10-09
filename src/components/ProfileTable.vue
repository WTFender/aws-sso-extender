<!-- eslint-disable vue/no-mutating-props -->
<!-- eslint-disable vue/max-len -->
<template>
  <!--- profile editor popup --->
  <PDialog
    v-model:visible="editorVisible"
    header="Edit Profile"
    :style="{ width: '500px' }"
  >
    <PScrollPanel class="scroll" style="max-height: 300px">
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
            <ColorPicker
              v-if="colorPickerVisible"
              v-model="activeProfile.profile.custom!.color"
              :inline="true"
            />
          </PDialog>
        </div>
        <div
          v-if="
            activeProfile.applicationName === 'AWS Account'
              && (!permissions.console || !permissions.signin)
          "
          style="text-align: center; padding-top: 20px"
        >
          <PrimeButton
            size="small"
            icon="pi pi-lock"
            class="p-button-success"
            label="Request Permissions"
            style="margin-top: 5px"
            @click="requestPermissions()"
          />
          <p style="margin-top: 10px">
            In order to customize the AWS console and assume IAM roles, this extension
            requires additional permissions.
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
          <div style="margin-bottom: 10px">
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
            :style="{ 'background-color': `#${role.color}` }"
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
      <p style="color: red; display: none">
        Unable to save Profile.
      </p>
    </template>
  </PDialog>

  <!--- profile table filters--->
  <div
    v-if="tableEditor"
    style="
      background-color: #f3f5fb;
      border-bottom: 3px solid #dee2e6;
      padding-top: 10px;
      padding-bottom: 10px;
    "
  >
    <PrimeButton
      size="small"
      :icon="newTableSettings.showIcon ? 'pi pi-check-circle' : 'pi pi-circle'"
      class="filter-button"
      :class="
        newTableSettings.showIcon !== false ? 'p-button-primary' : 'p-button-secondary'
      "
      label="Icons"
      @click="
        newTableSettings.showIcon = !newTableSettings.showIcon;
        $emit('updateTableSettings', newTableSettings);
      "
    />
    <PrimeButton
      size="small"
      :icon="newTableSettings.showIamRoles ? 'pi pi-check-circle' : 'pi pi-circle'"
      class="filter-button"
      :class="
        newTableSettings.showIamRoles !== false
          ? 'p-button-primary'
          : 'p-button-secondary'
      "
      label="IAM Roles"
      @click="
        newTableSettings.showIamRoles = !newTableSettings.showIamRoles;
        $emit('updateTableSettings', newTableSettings);
      "
    />
    <br v-if="!newTableSettings.showIamRoles || !newTableSettings.showIcon" />
    <PrimeButton
      size="small"
      :icon="sortAppIcon"
      class="filter-button"
      :class="
        newTableSettings.sortApp !== false ? 'p-button-primary' : 'p-button-secondary'
      "
      label="Account"
      @click="sortByApp()"
    />
    <PrimeButton
      size="small"
      :icon="sortProfileIcon"
      class="filter-button"
      :class="
        newTableSettings.sortProfile !== false ? 'p-button-primary' : 'p-button-secondary'
      "
      label="Profile"
      @click="sortByProfile()"
    />
    <PrimeButton
      disabled
      size="small"
      :icon="newTableSettings.sortCustom ? 'pi pi-sort-alt' : 'pi pi-sort-alt-slash'"
      class="filter-button"
      :class="
        newTableSettings.sortCustom !== false ? 'p-button-primary' : 'p-button-secondary'
      "
      label="Custom"
    />
  </div>

  <!-- header -->
  <div v-if="tableEditor" class="profile">
    <div class="pi" style="color: transparent; width: 16px" />
    <div
      v-if="newTableSettings.showIcon"
      class="profile-field nav"
      style="width: 35px; vertical-align: middle; padding-left: 0px !important"
    />
    <div class="profile-field nav table-header" :style="{ width: columnWidth }">
      Account
    </div>
    <div class="profile-field nav table-header" :style="{ width: columnWidth }">
      Profile
    </div>
    <div
      v-if="newTableSettings.showIamRoles"
      class="profile-field nav table-header"
      :style="{ width: '25%' }"
    >
      IAM Roles
    </div>
  </div>

  <!--- profile table --->
  <div
    v-sortable="{
      disabled: !tableEditor,
      options: { group: 'name', animation: 250, easing: 'cubic-bezier(1, 0, 0, 1)' },
    }"
    @end="sortByCustom"
  >
    <div
      v-for="profile in sortedProfiles"
      :key="`${profile.id}-${profile.profile.id}`"
      class="profile"
      style="vertical-align: middle; text-align: left"
    >
      <img
        v-if="newTableSettings.showIcon"
        :alt="profile.name"
        :src="profile.applicationName === 'AWS Account' ? awsIconUrl : profile.icon"
        class="profile-field nav"
        width="100"
        height="35"
        style="width: 35px; object-fit: cover; padding-left: 0px"
        @click="!tableEditor ? navSelectedProfile(profile) : editProfile(profile)"
      />
      <div
        class="profile-field nav"
        :style="{ width: columnWidth }"
        @click="!tableEditor ? navSelectedProfile(profile) : editProfile(profile)"
      >
        <div v-if="profile.applicationName === 'AWS Account'">
          <p
            style="margin: 0px"
            class="truncate app-title"
            :title="profile.searchMetadata!.AccountName"
          >
            <b>{{ newTableSettings.sortApp === 'asc' || newTableSettings.sortApp === 'desc' ? profile.searchMetadata!.AccountName : profile.searchMetadata!.AccountId }}</b>
          </p>
          <p
            style="margin: 0px"
            class="truncate app-subtitle"
            :title="profile.searchMetadata!.AccountId"
          >
            {{ newTableSettings.sortApp === 'asc' || newTableSettings.sortApp === 'desc' ? profile.searchMetadata!.AccountId : profile.searchMetadata!.AccountName }}
          </p>
        </div>
        <div v-else>
          <p style="margin: 0px" class="truncate app-title" :title="profile.name">
            <b>{{ profile.profile.custom?.label || profile.name }}</b>
          </p>
        </div>
      </div>
      <span
        v-if="settings.firefoxContainers && profile.applicationName === 'AWS Account'"
        :title="isContainerOpen(profile) ? 'Active' : isContainer(profile) ? 'Inactive' : ''"
        :style="{ color: isContainerOpen(profile) ? 'green' : isContainer(profile) ? 'gray' : 'transparent' }"
      >●</span>
      <div
        class="profile-field nav"
        :style="{ width: columnWidth }"
        @click="!tableEditor ? navSelectedProfile(profile) : editProfile(profile)"
      >
        <PBadge
          v-if="profile.profile.name !== 'Default'"
          :value="profile.profile.custom?.label || profile.profile.name"
          :title="profile.profile.custom?.label || profile.profile.name"
          class="truncate"
          :style="{
            verticalAlign: 'middle',
            width: '100%',
            'background-color': profile.profile.custom?.color
              ? `#${profile.profile.custom?.color}`
              : `#${user.custom.colorDefault}`,
          }"
        />
        <br v-else />
      </div>
      <div
        v-if="newTableSettings.showIamRoles && profile.profile.custom?.iamRoles.length! > 0"
        class="profile-field nav"
        :style="{ width: '25%' }"
      >
        <PBadge
          v-for="(role, idx) in profile.profile.custom?.iamRoles"
          :key="idx"
          :value="role.label || role.roleName"
          class="role-link truncate"
          :style="{
            width: '100%',
            'background-color': `#${role.color}`,
            verticalAlign: 'middle',
          }"
          :title="role.label || role.roleName"
          @click="!tableEditor ? assumeIamRole(role, profile) : editProfile(profile)"
        />
      </div>
      <div
        style="float: right; margin-top: 5px"
        class="pi"
        :class="{
          'pi-star-fill': profile.profile.custom?.favorite,
          'pi-star': !profile.profile.custom?.favorite,
        }"
        @click="fave(profile)"
      />
      <div
        v-if="!user.appProfileIds.includes(profile.profile.id)"
        style="color: lightgrey; float: right; margin-top: 5px; margin-right: 10px;"
        class="pi pi-share-alt"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  AppData, ContextualIdentity, IamRole, UserData,
} from '../types';
import { getFontColor, waitForElement } from '../utils';

export default {
  name: 'ProfileTable',
  props: {
    loaded: {
      required: true,
      type: Boolean,
    },
    tableSettings: {
      type: Object,
      required: false,
      default: () => ({
        showIamRoles: true,
        showIcon: true,
        sortCustom: false,
        sortApp: 'desc' as false | string,
        sortProfile: false as false | string,
      }),
    },
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
    users: {
      required: true,
      type: Array,
      default: () => ([] as UserData[]),
    },
    appProfiles: {
      type: Array as () => AppData[],
      required: true,
    },
    settings: {
      required: true,
      type: Object,
    },
    demoMode: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['updateProfile', 'requestPermissions', 'updateTableSettings', 'saveUser'],
  data() {
    return {
      activeContainer: null,
      containers: [] as ContextualIdentity[],
      openContainers: [] as ContextualIdentity[],
      newTableSettings: {
        showIamRoles: true,
        showIcon: true,
        sortCustom: false,
        sortApp: 'desc' as false | string,
        sortProfile: false as false | string,
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
    awsIconUrl() {
      return new URL('../assets/img/aws.png', import.meta.url).href;
    },
    columnWidth() {
      if (!this.newTableSettings.showIcon && !this.newTableSettings.showIamRoles) {
        return '45%';
      }
      if (!this.newTableSettings.showIamRoles) {
        return '40%';
      }
      return '30%';
    },
    tableSettingsChanged() {
      return JSON.stringify(this.tableSettings) !== JSON.stringify(this.newTableSettings);
    },
    sortedProfiles() {
      const profiles: AppData[] = [];
      this.appProfiles.forEach((profile) => {
        if (profile.applicationName === 'AWS Account') {
          profile.sortName = this.newTableSettings.sortApp === 'ascNum'
            || this.newTableSettings.sortApp === 'descNum'
            ? profile.searchMetadata!.AccountId
            : profile.searchMetadata!.AccountName;
        } else {
          profile.sortName = profile.profile.custom?.label || profile.name;
        }
        if (
          profile.name.toLowerCase().includes(this.search.toLowerCase())
          || profile.profile.name.toLowerCase().includes(this.search.toLowerCase())
        ) {
          profiles.push(profile);
        }
      });
      // sort app name
      if (
        this.newTableSettings.sortApp === 'desc'
        || this.newTableSettings.sortApp === 'descNum'
      ) {
        return profiles.sort((a, b) => a.sortName!.localeCompare(b.sortName!));
      }
      if (
        this.newTableSettings.sortApp === 'asc'
        || this.newTableSettings.sortApp === 'ascNum'
      ) {
        return profiles.sort((a, b) => b.sortName!.localeCompare(a.sortName!));
      }
      // sort profile name
      if (this.newTableSettings.sortProfile === 'asc') {
        return profiles.sort((a, b) => b.profile.name.localeCompare(a.profile.name));
      }
      if (this.newTableSettings.sortProfile === 'desc') {
        return profiles.sort((a, b) => a.profile.name.localeCompare(b.profile.name));
      }
      // unsorted or last custom sort
      return profiles;
    },
    sortAppIcon() {
      return this.sortIcon(this.newTableSettings.sortApp);
    },
    sortProfileIcon() {
      return this.sortIcon(this.newTableSettings.sortProfile);
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
    loaded: {
      handler(v) {
        if (v) {
          this.newTableSettings = JSON.parse(JSON.stringify(this.settings.tableSettings));
        }
        // get firefox containers
        if (this.$ext.platform === 'firefox' && this.settings.firefoxContainers) {
          this.$ext.log('getFirefoxContainers');
          this.getFirefoxContainers();
        }
      },
    },
    editorVisible: {
      handler(v) {
        this.$ext.log('editorVisible');
        this.$ext.log(v);
        this.$emit('updateTableSettings', { profileEditor: v, ...this.newTableSettings });
      },
    },
  },
  created() {
    if (this.settings.tableSettings !== undefined) {
      this.newTableSettings = JSON.parse(JSON.stringify(this.settings.tableSettings));
    }
  },
  methods: {
    async getFirefoxContainers() {
      this.containers = await this.$ext.config.browser.contextualIdentities.query({});
      this.$ext.log(this.containers);
      this.openContainers = await this.$ext.config.browser.tabs.query({
        cookieStoreId: this.containers.forEach((c) => c.cookieStoreId),
        currentWindow: true,
      });
      this.$ext.log(this.openContainers);
    },
    isContainerOpen(profile) {
      let isOpen = false;
      const container = this.containers.find(
        (c) => c.name === this.sessionLabelSso(profile),
      );
      if (container) {
        this.openContainers.forEach((c) => {
          if (c.cookieStoreId === container.cookieStoreId) {
            isOpen = true;
          }
        });
      }
      return isOpen;
    },
    isContainer(profile) {
      let isContainer = false;
      this.containers.forEach((c) => {
        if (c.name === this.sessionLabelSso(profile)) {
          isContainer = true;
        }
      });
      return isContainer;
    },
    sessionLabelSso(profile) {
      if (profile.applicationName !== 'AWS Account') {
        return profile.profile.custom!.label || profile.profile.name;
      }
      return this.$ext.buildLabel(
        this.user.custom.sessionLabelSso,
        this.user.subject,
        profile.profile.custom!.label || profile.profile.name,
        null,
        profile.searchMetadata!.AccountId,
        profile.searchMetadata!.AccountName,
      );
    },
    sortIcon(sort) {
      if (sort === 'desc') {
        return 'pi pi-sort-alpha-down';
      }
      if (sort === 'asc') {
        return 'pi pi-sort-alpha-down-alt';
      }
      if (sort === 'descNum') {
        return 'pi pi-sort-numeric-down';
      }
      if (sort === 'ascNum') {
        return 'pi pi-sort-numeric-down-alt';
      }
      return 'pi pi-sort-alt-slash';
    },
    sortByApp() {
      this.newTableSettings.sortCustom = false;
      this.newTableSettings.sortProfile = false;
      if (this.newTableSettings.sortApp === false) {
        this.newTableSettings.sortApp = 'desc';
      } else if (this.newTableSettings.sortApp === 'desc') {
        this.newTableSettings.sortApp = 'asc';
      } else if (this.newTableSettings.sortApp === 'asc') {
        this.newTableSettings.sortApp = 'descNum';
      } else if (this.newTableSettings.sortApp === 'descNum') {
        this.newTableSettings.sortApp = 'ascNum';
      } else if (this.newTableSettings.sortApp === 'ascNum') {
        this.newTableSettings.sortApp = false;
      }
      this.$emit('updateTableSettings', {
        profileEditor: this.editorVisible,
        ...this.newTableSettings,
      });
    },
    sortByProfile() {
      this.newTableSettings.sortCustom = false;
      this.newTableSettings.sortApp = false;
      if (this.newTableSettings.sortProfile === false) {
        this.newTableSettings.sortProfile = 'desc';
      } else if (this.newTableSettings.sortProfile === 'desc') {
        this.newTableSettings.sortProfile = 'asc';
      } else if (this.newTableSettings.sortProfile === 'asc') {
        this.newTableSettings.sortProfile = false;
      }
      this.$emit('updateTableSettings', {
        profileEditor: this.editorVisible,
        ...this.newTableSettings,
      });
    },
    sortByCustom(event) {
      const customProfileIds: string[] = [];
      this.sortedProfiles.forEach((ap) => {
        customProfileIds.push(ap.profile.id);
      });
      const movedProfile = customProfileIds.splice(event.oldIndex, 1);
      customProfileIds.splice(event.newIndex, 0, movedProfile[0]);
      this.newTableSettings.sortApp = false;
      this.newTableSettings.sortProfile = false;
      this.newTableSettings.sortCustom = true;
      // eslint-disable-next-line vue/no-mutating-props
      this.user.appProfileIds = customProfileIds;
      this.$emit('saveUser');
      this.$emit('updateTableSettings', {
        profileEditor: this.editorVisible,
        ...this.newTableSettings,
      });
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
      this.activeProfile.profile.custom!.color = this.activeProfile.profile.custom!.color.replace(
        '#',
        '',
      );
      this.$emit('updateProfile', this.activeProfile);
      this.editorVisible = false;
    },
    removeIamRole(iamRole: IamRole, appProfile: AppData) {
      this.$ext.log('removeIamRole');
      const iamRoles: IamRole[] = [];
      appProfile.profile.custom!.iamRoles.forEach((role) => {
        if (
          role.roleName !== iamRole.roleName
          || role.accountId !== iamRole.accountId
          || role.profileId !== iamRole.profileId
        ) {
          iamRoles.push(role);
        }
      });
      appProfile.profile.custom!.iamRoles = iamRoles;
      this.$emit('updateProfile', appProfile);
    },
    setProfiles(profiles) {
      this.$ext.log('setProfiles');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      profiles.forEach((profile) => {});
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
          // eslint-disable-next-line prefer-destructuring
          let user = this.user;
          // eslint-disable-next-line vue/max-len
          if (this.settings.showAllProfiles && !this.user.appProfileIds.includes(appProfile.profile.id)) {
            user = this.findUserByProfileId(appProfile.profile.id);
          }
          const profileUrl = this.$ext.createProfileUrl(user, appProfile);
          window.open(profileUrl, '_blank');
        });
      });
    },
    findUserByProfileId(profileId) {
      // eslint-disable-next-line prefer-destructuring
      let user = this.user;
      this.users.forEach((u) => {
        if ((u as UserData).appProfileIds.includes(profileId)) {
          user = (u as UserData);
        }
      });
      return user;
    },
    async navSelectedProfile(profile) {
      let nav = true;
      // eslint-disable-next-line prefer-destructuring
      let user = this.user;
      // eslint-disable-next-line vue/max-len
      if (this.settings.showAllProfiles && !this.user.appProfileIds.includes(profile.profile.id)) {
        user = this.findUserByProfileId(profile.profile.id);
      }
      const profileUrl = this.$ext.createProfileUrl(user, profile);
      if (this.$ext.platform === 'firefox' && this.settings.firefoxContainers) {
        const containers = await this.$ext.config.browser.contextualIdentities.query({
          name: this.sessionLabelSso(profile),
        });
        if (containers.length >= 1) {
          // eslint-disable-next-line vue/max-len
          const tabs = this.$ext.config.browser.tabs.query({
            cookieStoreId: containers[0].cookieStoreId,
          });
          // highlight existing tabs
          (await tabs).forEach((tab) => {
            this.$ext.config.browser.tabs.highlight({ tabs: tab.index! });
            nav = false;
          });
        }
      }
      if (nav === true) {
        window.open(profileUrl, '_blank');
      }
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
.truncate {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.table-header,
.app-title,
.app-subtitle {
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}
.filter-button,
.filter {
  vertical-align: middle !important;
  padding-left: 10px !important;
}
.filter-button {
  margin-bottom: 10px !important;
  margin-left: 10px !important;
  padding: 5px !important;
}
.filter {
  margin-right: 3px;
}
.nav {
  cursor: pointer;
}
.shadow {
  box-shadow: rgba(149, 157, 165, 0.2) 0px 3px 3px;
}
.profile {
  padding: 5px;
  padding-left: 10px;
  padding-right: 10px;
  border-bottom: 1px solid #dee2e6;
}
.profile:hover {
  background-color: #f3f5fb;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 5px 5px;
}
.profile:last-child {
  padding-bottom: 8px;
}
.profile-field {
  display: inline-block;
  vertical-align: middle;
  padding-left: 10px;
}

.role-link {
  margin-left: 10px;
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
