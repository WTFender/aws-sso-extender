<!-- eslint-disable max-len -->
<template>
  <h2 style="margin-top: 0px;">
    Add IAM Assume Roles
  </h2>
  <div>
    <small
      id="sso-label"
      class="option-label"
    >IAM Role ARN</small><br>
    <InputText
      id="iamRoleArn"
      v-model="newIamRole.arn"
      name="arn"
      class="option-value"
      aria-describedby="arn-help"
      style="width: 330px;"
      placeholder="arn:aws:iam::123412341234:role/roleName"
    />
    <small
      id="label-help"
      class="option-label"
    >Role Label & Color</small><br>
    <InputText
      id="iamRoleLabel"
      v-model="newIamRole.label"
      name="label"
      class="option-value"
      style="width: 50%; margin-right: 1rem"
      placeholder="roleName"
      aria-describedby="label-help"
    />
    <ColorPicker
      v-model="newIamRole.color"
      @click="colorPickerVisible = !colorPickerVisible"
    />
    <InputText
      id="newIamRoleColor"
      v-model="newIamRole.color"
      style="width: 20%; margin-left: 1rem"
    />
    <small
      id="profiles-help"
      class="option-label"
    >Select SSO profiles</small>
    <PListbox
      id="awsAppProfiles"
      v-model="selectedProfiles"
      :options="awsAppProfiles"
      class="option-value"
      style="margin-bottom: 15px; font-size: .75rem;"
      list-style="max-height:150px"
      multiple
    >
      <template #option="slotProps">
        <div
          class="flex align-items-center"
          style="max-height: 30px; line-height: 0; padding: 0px; margin: 0px"
        >
          <small>{{ slotProps.option.label }}</small>
        </div>
      </template>
    </PListbox>
    <PrimeButton
      :disabled="newIamRole.arn === '' || selectedProfiles.length === 0"
      size="small"
      icon="pi pi-user-plus"
      class="p-button-primary"
      label="Add IAM Role"
      style="margin-left: 1rem; margin-right: 1rem"
      @click="addIamRole()"
    />
  </div>
</template>

<script lang="ts">
import { AppData } from '../types';

export default {
  name: 'IamRoles',
  props: {
    appProfiles: {
      required: true,
      type: Array<AppData>,
    },
    awsAppProfiles: {
      required: true,
      type: Array<AppData>,
    },
  },
  emits: ['addIamRole', 'saveUser', 'updateProfile'],
  data() {
    return {
      colorPickerVisible: false,
      selectedProfiles: [] as AppData[],
      newIamRole: {
        arn: '',
        label: '',
        color: '#222f3e',
        accountId: '',
        roleName: '',
      },
    };
  },
  created() {
    //
  },
  methods: {
    setColor() {
      const color = document.getElementById('color') as HTMLInputElement;
      this.colorPickerVisible = false;
      this.newIamRole.color = color.value;
    },
    resetIamRoles() {
      this.resetIamRolePage();
      this.appProfiles.forEach((ap) => {
        ap.profile!.custom!.iamRoles = [];
        this.$emit('updateProfile', ap);
      });
    },
    invalid(id) {
      const el = document.getElementById(id);
      if (el) { el.classList.add('p-invalid'); }
      setTimeout(() => {
        el!.classList.remove('p-invalid');
      }, 5000);
    },
    validateNewIamRole(): boolean {
      if (this.newIamRole.arn.startsWith('arn:aws:iam::')) {
        const accountId = this.newIamRole.arn.split(':')[4];
        const roleName = this.newIamRole.arn.split('/')[1];
        if (accountId === undefined || roleName === undefined) {
          // bad arn format
          this.invalid('iamRoleArn');
          return false;
        }
        if (this.selectedProfiles.length === 0) {
          // need to select at least 1 profile
          this.invalid('awsAppProfiles');
          return false;
        }
        this.newIamRole.accountId = accountId;
        this.newIamRole.roleName = roleName;
        return true;
      }
      this.invalid('iamRoleArn');
      return false;
    },
    addIamRole() {
      if (this.validateNewIamRole()) {
        this.selectedProfiles.forEach((ap) => {
          this.$emit('addIamRole', {
            profileId: ap.profile.id,
            accountId: this.newIamRole.accountId,
            roleName: this.newIamRole.roleName,
            color: this.newIamRole.color.replace('#', ''),
            label: this.newIamRole.label,
          });
        });
        this.resetIamRolePage();
        this.$emit('saveUser');
      }
    },
    resetIamRolePage() {
      this.newIamRole.arn = '';
      this.newIamRole.label = '';
      this.newIamRole.color = '#222f3e';
      this.newIamRole.accountId = '';
      this.newIamRole.roleName = '';
      this.selectedProfiles = [];
    },
  },
};
</script>

<style lang="scss" scoped>
h2, h3, h4, h5, h6, p, small, label, span, select, option, input, button, a {
  font-family: "Segoe UI", Tahoma, sans-serif;
}
.option-label, .option-value {
  margin-top: .5rem;
  margin-right: 1rem;
  font-size: 1rem;
}
.option-value {
  margin-left: 1rem;
  margin-bottom: 1.5rem;
}
</style>
