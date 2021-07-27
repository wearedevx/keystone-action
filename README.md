# keystone-action
Github action to use [Keystone](https://keystone.sh) secrets

## Pre-requisites

- The project secrets must be managed by [Keystone](https://keystone.sh);
- A CI must have been setup using `ks ci setup`;
- Secrets and files must have been sent to the GitHub CI usin `ks ci send`;

After `ks ci send`, you should 5 new secrets in your GitHub repository settings,
named `KEYSTONE_SLOT_X` with `X` a number from 1 to 5.

## Usage

```yaml

jobs:
  use_keystone-action:
    runs-on: ubuntu-latest
    name: A job to make keystone-ci usable secrets
    steps:
      # To use this repository's private action,
      # you must check out the repository
      - name: Checkout
        uses: actions/checkout@v2

      - name: Load Secrets
        uses: wearedevx/keystone-action
        id: load_secrets
        with:
          keystone_slot_1: ${{ secrets.KEYSTONE_SLOT_1 }}
          keystone_slot_2: ${{ secrets.KEYSTONE_SLOT_2 }}
          keystone_slot_3: ${{ secrets.KEYSTONE_SLOT_3 }}
          keystone_slot_4: ${{ secrets.KEYSTONE_SLOT_4 }}
          keystone_slot_5: ${{ secrets.KEYSTONE_SLOT_5 }}

```

After that point, your secrets are loaded as environment variables
and can be used as such in scripts, or via `${{ env.SECRET_NAME }}`.  
  
Files managed by [Keystone](https://keystone.sh) are written to the job’s 
container disk and are accessible under the same path you used when adding them
to [Keystone](https://keystone.sh).

