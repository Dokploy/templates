# Wikibase Suite User defined MediaWiki Extensions

This is a place for additional MediaWiki/Wikibase extensions. In order to load additional extensions, three things need to be done:

- Put the extension in this directory
- Load the extension via `deploy/config/Extension.php`
- Update the extension with MediaWiki

## Downloading the extension

In order to download additional MediaWiki extensions, you can visit e.g. https://www.mediawiki.org/wiki/Special:ExtensionDistributor. Select the extension to download. Next, select the MediaWiki version your extension needs to be compatible with. You can find out what MediaWiki Version you are running by visiting https://wikibase.example/wiki/Special:Version (replace the domain name with yours).

Once the file is downloaded, unpack it to `config/extensions`

```
deploy
|
+- config
   |
   +- extensions
      |
      +- README.md <- you are here
      |
      +- MyExtension <- we are going to create this directory

```

```sh
tar -xzf MyExtension.tar.gz -C path/to/deploy/config/extensions
```

Verify, that you created `deploy/config/extensions/MyExtension` and that this directory contains a `extension.json` file besides others.

## Load the extension

In order to load the extension into MediaWiki, you need to follow the installation instructions of your extension. In many cases though, you just need to add the following line to `deploy/config/Extensions.php`.

```php
wfLoadExtension('extensions/MyExtension')
```

And restart the Wikibase container running MediaWiki.

```sh
docker compose restart wikibase 
```

Some extensions might ask you to run `update.php` as part of the installation process. The Wikibase Suite Wikibase Image does this automatically in its entrypoint. There is no need for running `update.php` manually.

## Testing your extension

You can verify that your extension was loaded by visiting https://wikibase.example/wiki/Special:Version (replace the domain name with yours). Your extensions should be listed in the list of loaded extension.

## Updating the extension

When you install extensions manually as described above, you are responsible to update those extensions. Extensions might contain security vulnerabilities that eventually get patches. You are responsible to install these patches! When you upgrade a MediaWiki minor version, e.g. from 1.42 to 1.43 (this can happen with Wikibase Suite Deploy major version updates), the extension might need an update too in order to remain compatible.

## More information

More information are available in the [MediaWiki Manual](https://www.mediawiki.org/wiki/Manual:Extensions).
