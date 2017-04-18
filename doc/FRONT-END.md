# Hutch front-end application documentation

This document will explain the different functionalities of the front-end.

## Connect to the application

When the user first access the application, the user must click on the connect button on the top right of the screen, this will redirect the user to the glewlwyd authentication page. On successful authentication, the user will be redirected to Hutch with a valid token that will allow to manage safes and secrets.

![Not connected](https://github.com/babelouest/hutch/raw/master/doc/images/not_connected.png)

## Setup profile

On first connection, the user will need to setup his or her profile with a fortune message and a fortune image. So on every connection, the user will see the fortune message and image he or she has previously chosen, so he or she can verify he or she's connected to the correct server, to avoid some attacks like man in the middle.

![No profile](https://github.com/babelouest/hutch/raw/master/doc/images/no_profile.png)

The user must enter a fortune message. This can be anything he or she wants, as long it's no more than 512 characters. It's common to use a citation or any sentence that has a meaning for the user.

The user must also choose either a local image file, not over 400 Kb, or get a random file from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Main_Page).

![setup profile](https://github.com/babelouest/hutch/raw/master/doc/images/setup_profile.png)

Then, when the profile is set, the user can create and manage safes.

![no safe](https://github.com/babelouest/hutch/raw/master/doc/images/profile_set.png)

## Lock all safe

This will lock all safe on this device. To reopen them, the user has to enter the password again, even if he or she checked the option `keep this safe open on this device` before.

## Add a new safe

To add a new safe, the user must click the button in the top right of the home screen. Then, the user must set a name for the safe, unique for the user, an optional description, and a password. The password must be at least 8 characters. A strength meter is available for the user to enter a strong password. The safe name can't be changed once created.

![add safe](https://github.com/babelouest/hutch/raw/master/doc/images/add_safe.png)

## Safe connection

To access a safe, select it on the tab list on the top left of the screen.

![access safe](https://github.com/babelouest/hutch/raw/master/doc/images/home_with_safe.png)

Then, the user must enter the safe password to connect to the safe.

![connect safe](https://github.com/babelouest/hutch/raw/master/doc/images/safe_connect.png)

If the user chooses the option "keep this safe open on this device", this safe will no longer need the password to be accessible on this browser, as long as the user is connected. This is used to facilitate the process, but the user must take extreme precautions with this option, and use it only on a device the user trusts, e.g. not on a public or shared session.

## Reset safe password

If the user has lost its password, he or she can use the reset safe password process. To reset the password, the user must have the safe key exported before. This is explained in the [Import, export secrets, and export safe key](#import-export-secrets-and-export-safe-key) paragraph.

A safe password can't be reset if there is no secret in it.

![safe reset password](https://github.com/babelouest/hutch/raw/master/doc/images/safe_reset_password.png)

## Secrets management

When the user access a safe, the user can read, write, update, delete secrets and manage the safe.

![safe example](https://github.com/babelouest/hutch/raw/master/doc/images/safe_example_detailed.png)

### Secrets list

The secrets will be displayed using 2 columns on large enough screens, or 1 column for smaller screens (tablet or phone). All secrets are automatically sorted by their name. The user can also filter the secrets with their name.

To add a new secret, the user must click on the (+) button right to the search input. Then, a new secret is added to the list, with the name editable.

### Secret collapsed

By default, all secrets are collapsed on the list. When a secret is collapsed, the user can click to deploy it to access all values, the user can also copy the sernames or the passwords stored in this secret when i't collapsed by clicking on the buttons.

![Secret collapsed detailed](https://github.com/babelouest/hutch/raw/master/doc/images/secret_collapsed_detailed.png)

### Secret expanded

When the secret is expanded, all its value are displayed, except for the passwords that are hidden by default.

A value can have the following types:
- url: the url of the service
- login: the login for the service
- password: the password for the service
- secret questions: a set of secret questions and answers for the service to recover a lost password
- file: any file
- miscellaneous data: any text value

A secret can have as many values as possible. The only limit is that a secret can not be over 16Mb once encrypted, which is difficult to reach, unless the user stores large files. You can add as many rows of the same type as the user wants for each secret. Every value can also have a list of tags to distinguish them for example.

Every row can be edited or deleted. An updated or deleted row can't be recovered.

![Secret expanded detailed](https://github.com/babelouest/hutch/raw/master/doc/images/secret_expanded_detailed.png)

### Edit secret name and icon

By clicking on the edit secret button, the user can update its displayed name and its icon. To update the icon, the user must click on the button left to the name input when in edit mode. Then a modal window opens and allows the user to select an icon on a list of available icons, the icons are provided by [Font Awesome](http://fontawesome.io/).

![Select secret icon](https://github.com/babelouest/hutch/raw/master/doc/images/select_icon.png)

### Sort rows

The user can sort the rows of a secret. First the user must click on the sort button, then he or she can drag and drop each line to place them in a different place on the list.

### Export secret

The user can export this secret alone by clicking on its `Download secret` button. This will open a modal window where the user can select if the secret is exported with a password or not, then export the secret. This can be useful to exchange secrets between users.

![Export secret](https://github.com/babelouest/hutch/raw/master/doc/images/export_secret.png)

### Edit a row

By clicking on the edit row icon, the user can update the value. He or she can modify the value directly, or, for a password or a secret answer, generate a random value.

![Update rows](https://github.com/babelouest/hutch/raw/master/doc/images/update_rows.png)

#### Generate a random password

By clicking on the generate random password button, a modal window opens to select the characters available and the length of the generated password.

![Genrate password](https://github.com/babelouest/hutch/raw/master/doc/images/generate_password.png)

Then the user selects the password options, click on the button `Generate`, then click on the button `OK` to set the new generated password on the row value. The password is never displayed in this process, to protect the privacy. After that, the user can copy the new password in the clipboard and paste it when he or she create or update the password on the service.

#### Generate a random answer for a secret question

A _secret answer_ can also be generated by clicking on the `generate answer` button when the secret question is in edit mode. The answer is generated by picking at random 2 words from a list of most common words in the language the user uses the application. The answer will be totally wrong and that's the purpose, so an attacker won't be able to guess the answer from a background check of the user, but the user will still be able to answer them by using Hutch.

![Genrate answer](https://github.com/babelouest/hutch/raw/master/doc/images/generate_answer.png)

## Safe management

On the top right of the safe tab are the safe action buttons.

![Safe actions](https://github.com/babelouest/hutch/raw/master/doc/images/safe_actions_detailed.png)

### Reload all secrets

Reloads all the secrets from the database. Cancel any editing not saved.

### Lock safe

Lock the safe on the device. To reopen it, the user has to enter the password again, even if he or she checked the option `keep this safe open on this device` before.

### Import, export secrets, and export safe key

This opens a modal window where the user can export all safe secrets, import ones, or export the safe key.

![Manage safe](https://github.com/babelouest/hutch/raw/master/doc/images/manage_safe.png)

#### Export all safe secrets

Exporting all safe secrets may be useful for the user but very dangerous. So it's possible to export the secrets and encrypt the export with a password. There is no minimum length for the export password. Remember to store the export in a safe place.

#### Import secrets

This is used to import previously exported secrets. An import file can be a unencrypted `.json` file or an encrypted `.bin` file. The imported secrets will be added to the current ones as new secrets.

#### Export safe key

This is the only way for the user to reset the safe password if it's been forgotten. Because this can be very dangerous and to improve security, the user must enter its current safe password in order to export the safe key. The user must be very careful with this functionality and keep the safe key file in ikn a secured drive. _The safe key file isn't protected by a password_.

### Reset safe key

This opens a modal window where the user can reset the safe key and the safe password. This can be used if for some reason, the users thinks the safe has been compromised, like if the safe is opened on another device the user no longer has access to. This will generate a new safe key, re-encrypt all secrets with the new key, save the secrets re-encrypted in the database, and save the new re-encrypted safe key in the database.

If the user previously has exported the safe key, this key file will no longer be able to reset the password, so the user must export again the new safe key as described in the [paragraph below](#export-safe-key).

### Edit safe description and reset password

This will open a modal where the user can update the safe description, and/or update the safe password. To update the safe password, the user must previously enter the current one. The new password has the same strength policy than when creating a safe, with 8 characters minimum, and a strength meter is displayed on the screen.

![Edit safe](https://github.com/babelouest/hutch/raw/master/doc/images/edit_safe.png)

### Delete safe

This will open a confirm modal window to the user. If the user confirms the suppression, the safe will be deleted premanently.
