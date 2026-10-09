import fs from "node:fs";
import path from "node:path";

// Run after `npx cap add android`. Safe to re-run after Capacitor upgrades.
const root = process.cwd();
const android = path.join(root, "android");
const manifest = path.join(android, "app/src/main/AndroidManifest.xml");
if (!fs.existsSync(manifest)) {
  console.error("Android project missing. Run npm run android:init after dependencies are installed.");
  process.exit(1);
}
const edit = (file, transform) => {
  if (!fs.existsSync(file)) throw new Error(`Capacitor template changed: ${file}`);
  fs.writeFileSync(file, transform(fs.readFileSync(file, "utf8")));
};
const variables = path.join(android, "variables.gradle");
edit(variables, (text) => {
  for (const [key, value] of [["compileSdkVersion",36],["targetSdkVersion",36]]) {
    if (!new RegExp(`\\b${key}\\s*=`).test(text)) throw new Error(`Missing ${key} in variables.gradle`);
    text = text.replace(new RegExp(`(\\b${key}\\s*=\\s*)\\d+`), (_, prefix) => `${prefix}${value}`);
  }
  return text;
});
edit(manifest, (text) => {
  if (!text.includes('android:screenOrientation="portrait"')) {
    text = text.replace(/<activity\b/, '<activity android:screenOrientation="portrait"');
  }
  return text;
});
const main = path.join(android, "app/src/main/java/com/yourname/sortverse/MainActivity.java");
// Generated MainActivity path follows the confirmed appId. The placeholder path
// will be adjusted below if the publisher changes the appId before setup.
const activity = path.join(android, "app/src/main");
const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir,entry.name)) : [path.join(dir,entry.name)]) : [];
const mainPath = walk(path.join(activity,"java")).find((p) => path.basename(p) === "MainActivity.java") || main;
edit(mainPath, (text) => {
  if (text.includes("EdgeToEdge.enable(this)")) return text;
  if (!text.includes("extends BridgeActivity")) throw new Error("Unexpected MainActivity template");
  text = text.replace(/import com\.getcapacitor\.BridgeActivity;/,'import com.getcapacitor.BridgeActivity;\nimport androidx.activity.EdgeToEdge;\nimport android.os.Bundle;');
  text = text.replace(/public class MainActivity extends BridgeActivity\s*\{/, `public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    EdgeToEdge.enable(this);
  }
`);
  return text;
});
const gradle = path.join(android,"app/build.gradle");
edit(gradle,(text)=>{
  const flag='// SORTVERSE_RELEASE_SIGNING_START';
  if(text.includes(flag)) return text;
  return `${text}\n${flag}\n` + `
// Keystore file and credentials are private; see docs/ANDROID_RELEASE.md.
def sortverseKeystoreFile = rootProject.file('keystore.properties')
def sortverseKeystore = new Properties()
if (sortverseKeystoreFile.exists()) {
    sortverseKeystore.load(new FileInputStream(sortverseKeystoreFile))
} else if (gradle.startParameter.taskNames.any { it.toLowerCase().contains('bundlerelease') }) {
    throw new GradleException('Missing android/keystore.properties; refuse to build unsigned release AAB')
}
android {
    signingConfigs {
        sortverseRelease {
            if (sortverseKeystoreFile.exists()) {
                storeFile rootProject.file(sortverseKeystore['storeFile'])
                storePassword sortverseKeystore['storePassword']
                keyAlias sortverseKeystore['keyAlias']
                keyPassword sortverseKeystore['keyPassword']
            }
        }
    }
    buildTypes {
        release { signingConfig signingConfigs.sortverseRelease }
    }
}
// SORTVERSE_RELEASE_SIGNING_END
`;
});
const res = path.join(android,"app/src/main/res");
const assets=path.join(root,"native-assets/android/res");
function copyTree(from,to){for(const entry of fs.readdirSync(from,{withFileTypes:true})){
 const src=path.join(from,entry.name),dest=path.join(to,entry.name);
 if(entry.isDirectory()){fs.mkdirSync(dest,{recursive:true});copyTree(src,dest);}else fs.copyFileSync(src,dest);
}}
copyTree(assets,res);
const strings = path.join(res, "values/strings.xml");
edit(strings,text=>text.replace(/(<string name="app_name">)[^<]*(<\/string>)/, '$1SortVerse 3D$2')
 .replace(/(<string name="title_activity_main">)[^<]*(<\/string>)/, '$1SortVerse 3D$2'));
const style = path.join(res, "values/styles.xml");
edit(style,(text) => text.includes('name="android:windowSplashScreenBackground"') ? text : text.replace(/<style name="AppTheme.NoActionBarLaunch"([^>]*)>/, '<style name="AppTheme.NoActionBarLaunch"$1>\n        <item name="android:windowSplashScreenBackground">#020b15</item>'));
console.log("Android portrait, SDK 36, signing, splash and icons configured.");
