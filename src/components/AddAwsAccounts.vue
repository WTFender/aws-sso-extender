<!-- eslint-disable max-len -->
<template>
  <h2 style="margin-top: 0px;">
    Add AWS Accounts
  </h2>
  <div>
    <small
      id="sso-label"
      class="option-label"
    >AWS Account ID</small><br>
    <InputText
      id="newAccountId"
      v-model="newAccount.accountId"
      name="arn"
      class="option-value"
      style="width: 330px;"
      placeholder="123412341234"
    />
    <small
      id="label-help"
      class="option-label"
    >Account Label & Color</small><br>
    <InputText
      id="newAccountLabel"
      v-model="newAccount.label"
      v-tooltip.bottom="'Overrides the default accountName, leave blank to use default'"
      name="label"
      class="option-value"
      style="width: 50%; margin-right: 1rem"
      placeholder="accountName"
      aria-describedby="label-help"
    />
    <ColorPicker
      v-model="newAccount.color"
      @click="colorPickerVisible = !colorPickerVisible"
    />
    <InputText
      id="newIamRoleColor"
      v-model="newAccount.color"
      style="width: 20%; margin-left: 1rem"
    />
    <PrimeButton
      :disabled="newAccount.accountId.length !== 12"
      size="small"
      icon="pi pi-user-plus"
      class="p-button-primary"
      label="Add Account"
      style="margin-left: 1rem; margin-right: 1rem"
      @click="addAccount()"
    />
  </div>
</template>

<script lang="ts">
import { UserData } from '../types';

export default {
  name: 'AddAwsAccounts',
  props: {
    accounts: {
      required: true,
      type: Array<UserData["custom"]["accounts"]>,
    },
    /*
    awsAppProfiles: {
      required: true,
      type: Array<AppData>,
    },
    */
  },
  emits: ['addAccount'],
  data() {
    return {
      awsAccounts: {},
      colorPickerVisible: false,
      newAccount: {
        label: '',
        color: '#222f3e',
        accountId: '',
        favorite: false,
        hide: false,
        icon: null,
        iamRoles: [],
      },
    };
  },
  created() {
    this.awsAccounts = this.accounts;
  },
  methods: {
    validateNewAccount(): boolean {
      // 1111222233334444
      const valid = /^\d{12}$/.test(this.newAccount.accountId);
      if (!valid) {
        this.invalid('newAccountId');
      }
      return valid;
    },
    invalid(id) {
      const el = document.getElementById(id);
      if (el) { el.classList.add('p-invalid'); }
      setTimeout(() => {
        el!.classList.remove('p-invalid');
      }, 5000);
    },
    addAccount() {
      if (this.validateNewAccount()) {
        const { accountId, ...newAccount } = this.newAccount;
        this.$emit('addAccount', accountId, newAccount);
        this.resetIamRolePage();
      }
    },
    resetIamRolePage() {
      this.newAccount.label = '';
      this.newAccount.color = '#222f3e';
      this.newAccount.accountId = '';
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
