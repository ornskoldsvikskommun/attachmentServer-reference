# attachmentServer
A file based reference implementation of the origo attachment server interface. Only implements the _origo_-format, not _arcggis_

Only to be used for testing the attachment feature of origo, as error handling and performance is pretty much non-existent.

## Usage ##
Donwload and restore npm packages and run `node app.js`

The application has no configuration. All files are stored in the subfolder _stash_. As the storage is file based and folder names
are used as data, don't use strange characters in layer names, foreign keys and group names.
