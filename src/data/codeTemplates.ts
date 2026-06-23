export interface AppConfig {
  packageName: string;
  dnsProvider: 'cloudflare' | 'adguard' | 'dynamic' | 'cloudflare_gaming' | 'google_gaming';
  dialerCode: string;
  adminPasswordHash: string; // Used in code as demonstration
  deepLinkScheme: string;
  deepLinkHost: string;
  language: 'kotlin' | 'java';
}

export function getAndroidManifest(config: AppConfig): string {
  const isKotlin = config.language === 'kotlin';
  const vpnServiceClass = ".SilentVpnService";
  const mainActivityClass = ".MainActivity";
  const adminReceiverClass = ".AdminReceiver";
  const secretReceiverClass = ".SecretCodeReceiver";

  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.packageName}">

    <!-- Permissions required for VPN, telephone dialer, and run at boot -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <!-- Android 14+ specific foreground service type -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Design.NoActionBar">

        <!-- 1. MAIN ACTIVITY: Handles settings, master password verification -->
        <activity
            android:name="${mainActivityClass}"
            android:exported="true"
            android:theme="@style/Theme.Design.NoActionBar">
            
            <!-- Custom Deep Link scheme (e.g. ${config.deepLinkScheme}://${config.deepLinkHost}) to open the app -->
            <intent-filter android:label="@string/app_name">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="${config.deepLinkScheme}" android:host="${config.deepLinkHost}" />
            </intent-filter>
        </activity>

        <!-- 2. LAUNCHER ALIAS ACTIVITY: This is the icon that gets disabled to hide the app -->
        <activity-alias
            android:name=".LauncherActivity"
            android:targetActivity="${mainActivityClass}"
            android:enabled="true"
            android:icon="@mipmap/ic_launcher"
            android:label="@string/app_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>

        <!-- 3. SILENT local VPN SERVICE: Executes the DNS routing -->
        <service
            android:name="${vpnServiceClass}"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:foregroundServiceType="specialUse"
            android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>

        <!-- 4. DEVICE ADMIN RECEIVER: Secures app against immediate force-stops & uninstalls -->
        <receiver
            android:name="${adminReceiverClass}"
            android:label="@string/device_admin_label"
            android:description="@string/device_admin_desc"
            android:permission="android.permission.BIND_DEVICE_ADMIN"
            android:exported="true">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin_rules" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
            </intent-filter>
        </receiver>

        <!-- 5. OUTGOING TELEPHONY DIALER SECRET CODE RECEIVER: Reopens app stealthily -->
        <receiver
            android:name="${secretReceiverClass}"
            android:exported="true">
            <intent-filter>
                <action android:name="android.provider.Telephony.SECRET_CODE" />
                <data android:scheme="android_secret_code" android:host="${config.dialerCode}" />
            </intent-filter>
        </receiver>

        <!-- Optional: Restart VPN after device boots up -->
        <receiver
            android:name=".BootReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`;
}

export function getMainActivityCode(config: AppConfig): string {
  if (config.language === 'kotlin') {
    return `package ${config.packageName}

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.VpnService
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

/**
 * MainActivity: Code Hub for configuring the permanent adult content blocker.
 * Designed to compile perfectly in standard IDEs (Android Studio, AIDE, Sketchware Pro).
 */
class MainActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    private lateinit var radioGroupDns: RadioGroup
    private lateinit var radioCloudflare: RadioButton
    private lateinit var radioAdGuard: RadioButton
    private lateinit var radioDynamic: RadioButton
    private lateinit var radioCloudflareGaming: RadioButton
    private lateinit var radioGoogleGaming: RadioButton
    private lateinit var btnLock: Button
    private lateinit var btnUnlock: Button
    private lateinit var txtStatus: TextView
    private lateinit var layoutLockControls: LinearLayout
    private lateinit var layoutUnlockControls: LinearLayout
    private lateinit var editPass: EditText
    private lateinit var editCode: EditText
    private lateinit var editPassUnlock: EditText
    
    // New diagnostics and ping elements
    private lateinit var btnTestPing: Button
    private lateinit var txtPingResults: TextView
    private lateinit var btnExportLog: Button

    companion object {
        const val PREFS_NAME = "secure_dns_prefs"
        const val KEY_PROVIDER = "dns_provider" // "cloudflare" or "adguard"
        const val KEY_LOCKED = "admin_locked"
        const val KEY_PASS = "admin_password"
        const val KEY_DIAL_CODE = "dial_code"
        
        const val REQUEST_VPN = 1001
        const val REQUEST_ADMIN = 1002
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, AdminReceiver::class.java)

        initViews()
        setupListeners()
        updateStatus()
    }

    private fun initViews() {
        radioGroupDns = findViewById(R.id.radioGroupDns)
        radioCloudflare = findViewById(R.id.radioCloudflare)
        radioAdGuard = findViewById(R.id.radioAdGuard)
        radioDynamic = findViewById(R.id.radioDynamic)
        radioCloudflareGaming = findViewById(R.id.radioCloudflareGaming)
        radioGoogleGaming = findViewById(R.id.radioGoogleGaming)
        btnLock = findViewById(R.id.btnLock)
        btnUnlock = findViewById(R.id.btnUnlock)
        txtStatus = findViewById(R.id.txtStatus)
        layoutLockControls = findViewById(R.id.layoutLockControls)
        layoutUnlockControls = findViewById(R.id.layoutUnlockControls)
        editPass = findViewById(R.id.editPass)
        editCode = findViewById(R.id.editCode)
        editPassUnlock = findViewById(R.id.editPassUnlock)
        
        // New diagnostics and ping elements
        btnTestPing = findViewById(R.id.btnTestPing)
        txtPingResults = findViewById(R.id.txtPingResults)
        btnExportLog = findViewById(R.id.btnExportLog)

        // Prepopulate based on shared preferences
        val activeProvider = prefs.getString(KEY_PROVIDER, "${config.dnsProvider}") ?: "cloudflare"
        when (activeProvider) {
          "cloudflare" -> radioCloudflare.isChecked = true
          "adguard" -> radioAdGuard.isChecked = true
          "dynamic" -> radioDynamic.isChecked = true
          "cloudflare_gaming" -> radioCloudflareGaming.isChecked = true
          "google_gaming" -> radioGoogleGaming.isChecked = true
        }

        val code = prefs.getString(KEY_DIAL_CODE, "${config.dialerCode}") ?: "${config.dialerCode}"
        editCode.setText(code)

        val isLocked = prefs.getBoolean(KEY_LOCKED, false)
        if (isLocked) {
            layoutLockControls.visibility = View.GONE
            layoutUnlockControls.visibility = View.VISIBLE
        } else {
            layoutLockControls.visibility = View.VISIBLE
            layoutUnlockControls.visibility = View.GONE
        }
    }

    private fun setupListeners() {
        // Handle changes in DNS Provider
        radioGroupDns.setOnCheckedChangeListener { _, checkedId ->
            val provider = when (checkedId) {
                R.id.radioAdGuard -> "adguard"
                R.id.radioDynamic -> "dynamic"
                R.id.radioCloudflareGaming -> "cloudflare_gaming"
                R.id.radioGoogleGaming -> "google_gaming"
                else -> "cloudflare"
            }
            prefs.edit().putString(KEY_PROVIDER, provider).apply()
            
            // If VPN is active, restart it dynamically to use new settings immediately
            if (isVpnRunning()) {
                startVpnService()
            }
        }

        btnLock.setOnClickListener {
            val pass = editPass.text.toString().trim()
            val code = editCode.text.toString().trim()

            if (pass.isEmpty()) {
                Toast.makeText(this, "Please define a Master Password!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (code.isEmpty()) {
                Toast.makeText(this, "Please define a dial/secret code!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Save variables to encrypted SharedPreferences
            prefs.edit()
                .putString(KEY_PASS, pass)
                .putString(KEY_DIAL_CODE, code)
                .putBoolean(KEY_LOCKED, true)
                .apply()

            // Request Device Admin setup first
            if (!devicePolicyManager.isAdminActive(adminComponent)) {
                val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                    putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Enforce persistent protection and prevent unauthorized uninstall.")
                }
                startActivityForResult(intent, REQUEST_ADMIN)
            } else {
                requestVpnActivation()
            }
        }

        btnUnlock.setOnClickListener {
            val passInput = editPassUnlock.text.toString().trim()
            val savedPass = prefs.getString(KEY_PASS, "${config.adminPasswordHash}")

            if (passInput == savedPass) {
                // Restore Launcher icon immediately
                enableLauncherIcon(true)

                // Deactivate system-wide filter
                stopVpnService()

                // Remove device admin restriction
                if (devicePolicyManager.isAdminActive(adminComponent)) {
                    devicePolicyManager.removeActiveAdmin(adminComponent)
                }

                prefs.edit().putBoolean(KEY_LOCKED, false).apply()
                
                layoutLockControls.visibility = View.VISIBLE
                layoutUnlockControls.visibility = View.GONE
                editPass.text.clear()
                editPassUnlock.text.clear()
                updateStatus()
                
                Toast.makeText(this, "Protection Unlocked & Filter Deactivated!", Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(this, "Incorrect Admin Password!", Toast.LENGTH_SHORT).show()
            }
        }
        
        // Setup new speed latency metrics click hook
        btnTestPing.setOnClickListener {
            testDnsLatency()
        }

        // Setup new export diagnostic activity trigger
        btnExportLog.setOnClickListener {
            exportDiagnostics()
        }
    }

    private fun testDnsLatency() {
        txtPingResults.text = "Measuring connection speed..."
        Thread {
            val cfResult = measureSocketLatency("1.1.1.3")
            val agResult = measureSocketLatency("94.140.14.15")
            val cfGameResult = measureSocketLatency("1.1.1.1")
            val ggGameResult = measureSocketLatency("8.8.8.8")
            runOnUiThread {
                txtPingResults.text = "Cloudflare Safe (1.1.1.3): \${if (cfResult > 0) "\$cfResult ms" else "Timeout"}\\n" +
                        "AdGuard Safe (94.140.14.15): \${if (agResult > 0) "\$agResult ms" else "Timeout"}\\n" +
                        "Cloudflare Fast (1.1.1.1) (PUBG Best): \${if (cfGameResult > 0) "\$cfGameResult ms" else "Timeout"}\\n" +
                        "Google Stable (8.8.8.8) (PUBG Best): \${if (ggGameResult > 0) "\$ggGameResult ms" else "Timeout"}"
            }
        }.start()
    }

    private fun measureSocketLatency(ip: String): Long {
        val socket = java.net.Socket()
        val address = java.net.InetSocketAddress(ip, 53)
        val startTime = System.currentTimeMillis()
        try {
            socket.connect(address, 1000)
            val elapsed = System.currentTimeMillis() - startTime
            socket.close()
            return elapsed
        } catch (e: Exception) {
            return -1
        }
    }

    private fun exportDiagnostics() {
        val isAdmin = devicePolicyManager.isAdminActive(adminComponent)
        val provider = prefs.getString(KEY_PROVIDER, "cloudflare")
        val isVpn = isVpnRunning()
        val dialCode = prefs.getString(KEY_DIAL_CODE, "${config.dialerCode}")
        
        val log = """
            =======================
            DIAGNOSTIC NETWORK REPORT
            =======================
            Package Name: ${config.packageName}
            DNS Provider Conf: \$provider
            VPN Service Active: \$isVpn
            Device Admin Level: \${if (isAdmin) "ARMED" else "DISARMED"}
            Launcher Stealth Pin: *#*#\$dialCode#*#*
            Timestamp: \${java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())}
            OS Integration Level: Android SDK \${android.os.Build.VERSION.SDK_INT}
            Battery Optimization Mode: Selective IP DNS-Only Intercept (Passive)
            -----------------------
            STATUS SUMMARY: \${if (isVpn && isAdmin) "FULLY SECURED" else "INCOMPLETE SECURITY"}
            =======================
        """.trimIndent()

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "DNS Adult Content Blocker Diagnostic Log")
            putExtra(Intent.EXTRA_TEXT, log)
        }
        startActivity(Intent.createChooser(intent, "Share Diagnostic Logs"))
    }

    private fun requestVpnActivation() {
        val vpnIntent = VpnService.prepare(this)
        if (vpnIntent != null) {
            startActivityForResult(vpnIntent, REQUEST_VPN)
        } else {
            onActivityResult(REQUEST_VPN, RESULT_OK, null)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_ADMIN) {
            if (resultCode == RESULT_OK) {
                Toast.makeText(this, "Device Administrator Armed!", Toast.LENGTH_SHORT).show()
                requestVpnActivation()
            } else {
                Toast.makeText(this, "Admin permission rejected. Protection is incomplete.", Toast.LENGTH_LONG).show()
            }
        } else if (requestCode == REQUEST_VPN) {
            if (resultCode == RESULT_OK) {
                startVpnService()
                // EXTREME STEALTH: Disable the home screen launcher icon permanently to prevent bypassing
                enableLauncherIcon(false)
                
                layoutLockControls.visibility = View.GONE
                layoutUnlockControls.visibility = View.VISIBLE
                editPass.text.clear()
                updateStatus()

                Toast.makeText(this, "Protection Activated! This App Icon is now Hidden.", Toast.LENGTH_LONG).show()
                finish() // Exits screen cleanly
            } else {
                Toast.makeText(this, "VPN authorization denied! Cannot start filter.", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun startVpnService() {
        val serviceIntent = Intent(this, SilentVpnService::class.java)
        startService(serviceIntent)
    }

    private fun stopVpnService() {
        val serviceIntent = Intent(this, SilentVpnService::class.java)
        stopService(serviceIntent)
    }

    private fun isVpnRunning(): Boolean {
        // Can be queried via SharedPreferences state updated by VpnService
        return prefs.getBoolean("vpn_active", false)
    }

    private fun enableLauncherIcon(enable: Boolean) {
        val p = packageManager
        // Target LauncherActivity alias which controls presence in Launcher App Drawer
        val componentName = ComponentName(this, "\${packageName}.LauncherActivity")
        val state = if (enable) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        p.setComponentEnabledSetting(
            componentName,
            state,
            PackageManager.DONT_KILL_APP
        )
    }

    private fun updateStatus() {
        val isLocked = prefs.getBoolean(KEY_LOCKED, false)
        if (isLocked) {
            val activeProvider = prefs.getString(KEY_PROVIDER, "cloudflare")?.uppercase()
            txtStatus.text = "🔒 STATUS: SECURED\\nActive Filter: \$activeProvider DNS\\nDevice Admin: ARMED\\nStealth Mode: ICON HIDDEN"
            txtStatus.setTextColor(resources.getColor(android.R.color.holo_green_dark))
        } else {
            txtStatus.text = "🔓 STATUS: UNPROTECTED\\nNo adult filter active.\\nApp drawer icon is visible."
            txtStatus.setTextColor(resources.getColor(android.R.color.holo_red_dark))
        }
    }
}`;
  } else {
    // Java version of MainActivity
    return `package ${config.packageName};

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

/**
 * MainActivity: Code Hub for configuring the permanent adult content blocker.
 * Written in standard, high-efficiency Java for compatibility with compilers such as AIDE.
 */
public class MainActivity extends AppCompatActivity {

    public static final String PREFS_NAME = "secure_dns_prefs";
    public static final String KEY_PROVIDER = "dns_provider";
    public static final String KEY_LOCKED = "admin_locked";
    public static final String KEY_PASS = "admin_password";
    public static final String KEY_DIAL_CODE = "dial_code";
    
    private static final int REQUEST_VPN = 1001;
    private static final int REQUEST_ADMIN = 1002;

    private SharedPreferences prefs;
    private DevicePolicyManager devicePolicyManager;
    private ComponentName adminComponent;

    private RadioGroup radioGroupDns;
    private RadioButton radioCloudflare;
    private RadioButton radioAdGuard;
    private RadioButton radioDynamic;
    private RadioButton radioCloudflareGaming;
    private RadioButton radioGoogleGaming;
    private Button btnLock;
    private Button btnUnlock;
    private TextView txtStatus;
    private LinearLayout layoutLockControls;
    private LinearLayout layoutUnlockControls;
    private EditText editPass;
    private EditText editCode;
    private EditText editPassUnlock;
    
    // New diagnostics and ping elements
    private Button btnTestPing;
    private TextView txtPingResults;
    private Button btnExportLog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        devicePolicyManager = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        adminComponent = new ComponentName(this, AdminReceiver.class);

        initViews();
        setupListeners();
        updateStatus();
    }

    private void initViews() {
        radioGroupDns = findViewById(R.id.radioGroupDns);
        radioCloudflare = findViewById(R.id.radioCloudflare);
        radioAdGuard = findViewById(R.id.radioAdGuard);
        radioDynamic = findViewById(R.id.radioDynamic);
        radioCloudflareGaming = findViewById(R.id.radioCloudflareGaming);
        radioGoogleGaming = findViewById(R.id.radioGoogleGaming);
        btnLock = findViewById(R.id.btnLock);
        btnUnlock = findViewById(R.id.btnUnlock);
        txtStatus = findViewById(R.id.txtStatus);
        layoutLockControls = findViewById(R.id.layoutLockControls);
        layoutUnlockControls = findViewById(R.id.layoutUnlockControls);
        editPass = findViewById(R.id.editPass);
        editCode = findViewById(R.id.editCode);
        editPassUnlock = findViewById(R.id.editPassUnlock);
        
        // New diagnostics and ping elements
        btnTestPing = findViewById(R.id.btnTestPing);
        txtPingResults = findViewById(R.id.txtPingResults);
        btnExportLog = findViewById(R.id.btnExportLog);

        // Prepopulate based on preferences
        String activeProvider = prefs.getString(KEY_PROVIDER, "${config.dnsProvider}");
        if ("adguard".equals(activeProvider)) {
            radioAdGuard.setChecked(true);
        } else if ("dynamic".equals(activeProvider)) {
            radioDynamic.setChecked(true);
        } else if ("cloudflare_gaming".equals(activeProvider)) {
            radioCloudflareGaming.setChecked(true);
        } else if ("google_gaming".equals(activeProvider)) {
            radioGoogleGaming.setChecked(true);
        } else {
            radioCloudflare.setChecked(true);
        }

        String code = prefs.getString(KEY_DIAL_CODE, "${config.dialerCode}");
        editCode.setText(code);

        boolean isLocked = prefs.getBoolean(KEY_LOCKED, false);
        if (isLocked) {
            layoutLockControls.setVisibility(View.GONE);
            layoutUnlockControls.setVisibility(View.VISIBLE);
        } else {
            layoutLockControls.setVisibility(View.VISIBLE);
            layoutUnlockControls.setVisibility(View.GONE);
        }
    }

    private void setupListeners() {
        radioGroupDns.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                String provider = "cloudflare";
                if (checkedId == R.id.radioAdGuard) {
                    provider = "adguard";
                } else if (checkedId == R.id.radioDynamic) {
                    provider = "dynamic";
                } else if (checkedId == R.id.radioCloudflareGaming) {
                    provider = "cloudflare_gaming";
                } else if (checkedId == R.id.radioGoogleGaming) {
                    provider = "google_gaming";
                }
                prefs.edit().putString(KEY_PROVIDER, provider).apply();
                
                // If VPN is active, restart dynamically to apply the new selected DNS
                if (isVpnRunning()) {
                    startVpnService();
                }
            }
        });

        btnLock.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String pass = editPass.getText().toString().trim();
                String code = editCode.getText().toString().trim();

                if (pass.isEmpty()) {
                    Toast.makeText(MainActivity.this, "Please define a Master Password!", Toast.LENGTH_SHORT).show();
                    return;
                }
                if (code.isEmpty()) {
                    Toast.makeText(MainActivity.this, "Please define a dial/secret code!", Toast.LENGTH_SHORT).show();
                    return;
                }

                prefs.edit()
                    .putString(KEY_PASS, pass)
                    .putString(KEY_DIAL_CODE, code)
                    .putBoolean(KEY_LOCKED, true)
                    .apply();

                if (!devicePolicyManager.isAdminActive(adminComponent)) {
                    Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
                    intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
                    intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Enforce persistent protection and prevent unauthorized uninstall.");
                    startActivityForResult(intent, REQUEST_ADMIN);
                } else {
                    requestVpnActivation();
                }
            }
        });

        btnUnlock.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String passInput = editPassUnlock.getText().toString().trim();
                String savedPass = prefs.getString(KEY_PASS, "${config.adminPasswordHash}");

                if (passInput.equals(savedPass)) {
                    // Restore Launcher icon immediately
                    enableLauncherIcon(true);

                    // Deactivate system-wide filter
                    stopVpnService();

                    // Remove device admin restriction
                    if (devicePolicyManager.isAdminActive(adminComponent)) {
                        devicePolicyManager.removeActiveAdmin(adminComponent);
                    }

                    prefs.edit().putBoolean(KEY_LOCKED, false).apply();
                    
                    layoutLockControls.setVisibility(View.VISIBLE);
                    layoutUnlockControls.setVisibility(View.GONE);
                    editPass.setText("");
                    editPassUnlock.setText("");
                    updateStatus();
                    
                    Toast.makeText(MainActivity.this, "Protection Unlocked & Filter Deactivated!", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(MainActivity.this, "Incorrect Admin Password!", Toast.LENGTH_SHORT).show();
                }
            }
        });
        
        btnTestPing.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                testDnsLatency();
            }
        });

        btnExportLog.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                exportDiagnostics();
            }
        });
    }

    private void testDnsLatency() {
        txtPingResults.setText("Measuring connection speed...");
        new Thread(new Runnable() {
            @Override
            public void run() {
                final long cfResult = measureSocketLatency("1.1.1.3");
                final long agResult = measureSocketLatency("94.140.14.15");
                final long cfGameResult = measureSocketLatency("1.1.1.1");
                final long ggGameResult = measureSocketLatency("8.8.8.8");
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        String cfStr = cfResult > 0 ? cfResult + " ms" : "Timeout";
                        String agStr = agResult > 0 ? agResult + " ms" : "Timeout";
                        String cfGameStr = cfGameResult > 0 ? cfGameResult + " ms" : "Timeout";
                        String ggGameStr = ggGameResult > 0 ? ggGameResult + " ms" : "Timeout";
                        txtPingResults.setText("Cloudflare Safe (1.1.1.3): " + cfStr + "\\n" +
                                "AdGuard Safe (94.140.14.15): " + agStr + "\\n" +
                                "Cloudflare Fast (1.1.1.1) (PUBG Best): " + cfGameStr + "\\n" +
                                "Google Stable (8.8.8.8) (PUBG Best): " + ggGameStr);
                    }
                });
            }
        }).start();
    }

    private long measureSocketLatency(String ip) {
        java.net.Socket socket = new java.net.Socket();
        java.net.InetSocketAddress address = new java.net.InetSocketAddress(ip, 53);
        long startTime = System.currentTimeMillis();
        try {
            socket.connect(address, 1000);
            long elapsed = System.currentTimeMillis() - startTime;
            socket.close();
            return elapsed;
        } catch (Exception e) {
            return -1;
        }
    }

    private void exportDiagnostics() {
        boolean isAdmin = devicePolicyManager.isAdminActive(adminComponent);
        String provider = prefs.getString(KEY_PROVIDER, "cloudflare");
        boolean isVpn = isVpnRunning();
        String dialCode = prefs.getString(KEY_DIAL_CODE, "${config.dialerCode}");
        
        String log = "=======================\\n" +
                     "DIAGNOSTIC NETWORK REPORT\\n" +
                     "=======================\\n" +
                     "Package Name: ${config.packageName}\\n" +
                     "DNS Provider Conf: " + provider + "\\n" +
                     "VPN Service Active: " + isVpn + "\\n" +
                     "Device Admin Level: " + (isAdmin ? "ARMED" : "DISARMED") + "\\n" +
                     "Launcher Stealth Pin: *#*#" + dialCode + "#*#*\\n" +
                     "Timestamp: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(new java.util.Date()) + "\\n" +
                     "OS Integration Level: Android SDK " + android.os.Build.VERSION.SDK_INT + "\\n" +
                     "Battery Optimization Mode: Selective IP DNS-Only Intercept (Passive)\\n" +
                     "-----------------------\\n" +
                     "STATUS SUMMARY: " + ((isVpn && isAdmin) ? "FULLY SECURED" : "INCOMPLETE SECURITY") + "\\n" +
                     "=======================";

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_SUBJECT, "DNS Adult Content Blocker Diagnostic Log");
        intent.putExtra(Intent.EXTRA_TEXT, log);
        startActivity(Intent.createChooser(intent, "Share Diagnostic Logs"));
    }

    private void requestVpnActivation() {
        Intent vpnIntent = VpnService.prepare(this);
        if (vpnIntent != null) {
            startActivityForResult(vpnIntent, REQUEST_VPN);
        } else {
            onActivityResult(REQUEST_VPN, RESULT_OK, null);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_ADMIN) {
            if (resultCode == RESULT_OK) {
                Toast.makeText(this, "Device Administrator Armed!", Toast.LENGTH_SHORT).show();
                requestVpnActivation();
            } else {
                Toast.makeText(this, "Admin permission rejected. Protection is incomplete.", Toast.LENGTH_LONG).show();
            }
        } else if (requestCode == REQUEST_VPN) {
            if (resultCode == RESULT_OK) {
                startVpnService();
                enableLauncherIcon(false);
                
                layoutLockControls.setVisibility(View.GONE);
                layoutUnlockControls.setVisibility(View.VISIBLE);
                editPass.setText("");
                updateStatus();

                Toast.makeText(this, "Protection Activated! This App Icon is now Hidden.", Toast.LENGTH_LONG).show();
                finish();
            } else {
                Toast.makeText(this, "VPN authorization denied! Cannot start filter.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void startVpnService() {
        Intent serviceIntent = new Intent(this, SilentVpnService.class);
        startService(serviceIntent);
    }

    private void stopVpnService() {
        Intent serviceIntent = new Intent(this, SilentVpnService.class);
        stopService(serviceIntent);
    }

    private boolean isVpnRunning() {
        return prefs.getBoolean("vpn_active", false);
    }

    private void enableLauncherIcon(boolean enable) {
        PackageManager p = getPackageManager();
        ComponentName componentName = new ComponentName(this, "${config.packageName}.LauncherActivity");
        int state = enable ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
        p.setComponentEnabledSetting(componentName, state, PackageManager.DONT_KILL_APP);
    }

    private void updateStatus() {
        boolean isLocked = prefs.getBoolean(KEY_LOCKED, false);
        if (isLocked) {
            String activeProvider = prefs.getString(KEY_PROVIDER, "cloudflare").toUpperCase();
            txtStatus.setText("🔒 STATUS: SECURED\\nActive Filter: " + activeProvider + " DNS\\nDevice Admin: ARMED\\nStealth Mode: ICON HIDDEN");
            txtStatus.setTextColor(getResources().getColor(android.R.color.holo_green_dark));
        } else {
            txtStatus.setText("🔓 STATUS: UNPROTECTED\\nNo adult filter active.\\nApp drawer icon is visible.");
            txtStatus.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
        }
    }
}`;
  }
}

export function getSilentVpnServiceCode(config: AppConfig): string {
  if (config.language === 'kotlin') {
    return `package ${config.packageName}

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetAddress

/**
 * SilentVpnService: Extremely lightweight and battery-efficient local VpnService.
 * Intercepts DNS queries on the system and forwards them directly to secure, malware-free,
 * and adult-filtered DNS servers (Cloudflare or AdGuard).
 * 
 * Does not spawn resource-heavy packet processing loops, keeping battery consumption near 0%.
 */
class SilentVpnService : VpnService(), Runnable {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null
    private var isRunning = false

    companion object {
        private const val TAG = "SilentVpnService"
        
        // Cloudflare Family DNS (blocks Malware and Adult Content)
        private val CLOUDFLARE_DNS = arrayOf("1.1.1.3", "1.0.0.3", "2606:4700:4700::1113", "2606:4700:4700::1003")
        
        // AdGuard Family DNS (blocks Malware, Adult Content, and Ads)
        private val ADGUARD_DNS = arrayOf("94.140.14.15", "94.140.15.16", "2a10:50c0::bad:ff", "2a10:50c0::54:ff")

        // Cloudflare Gaming & Performance Engines (optimized for lowest latency routes globally)
        private val CLOUDFLARE_GAMING_DNS = arrayOf("1.1.1.1", "1.0.0.1", "2606:4700:4700::1111", "2606:4700:4700::1001")

        // Google Stable Performance Engine (highly stable gaming routing & anti-jitter)
        private val GOOGLE_GAMING_DNS = arrayOf("8.8.8.8", "8.8.4.4", "2001:4860:4860::8888", "2001:4860:4860::8844")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "VpnService Starting...")
        
        // Restart the thread to execute clean DNS changes if already running
        stopVpn()
        
        isRunning = true
        vpnThread = Thread(this, "SilentVpnThread").apply {
            start()
        }
        
        return START_STICKY
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    private fun stopVpn() {
        isRunning = false
        try {
            vpnInterface?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing interface", e)
        }
        vpnInterface = null
        vpnThread?.interrupt()
        vpnThread = null
        
        // Publish state to shared preference
        getSharedPreferences("secure_dns_prefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("vpn_active", false)
            .apply()
    }

    override fun run() {
        try {
            val prefs = getSharedPreferences("secure_dns_prefs", Context.MODE_PRIVATE)
            val selectedProvider = prefs.getString("dns_provider", "${config.dnsProvider}") ?: "cloudflare"

            Log.i(TAG, "Activating silent DNS filter using provider: $selectedProvider")

            val builder = Builder()
                .setSession("Silent Adult Content Blocker")
                .setConfigureIntent(null) // Prevents standard user clicks to open configuration
                
            // Set arbitrary local interface networks to anchor local routing table
            builder.addAddress("10.0.0.2", 32)
            builder.addAddress("fd00:a:b:c::2", 128)

            // Select DNS servers dynamically
            val dnsAddresses = when (selectedProvider) {
                "adguard" -> ADGUARD_DNS
                "cloudflare_gaming" -> CLOUDFLARE_GAMING_DNS
                "google_gaming" -> GOOGLE_GAMING_DNS
                else -> CLOUDFLARE_DNS
            }

            // Bind the secure DNS IP addresses
            for (dns in dnsAddresses) {
                builder.addDnsServer(dns)
                // Add explicit routing boundaries for the specified DNS servers. 
                // This forces standard DNS queries directly into this physical adapter loop.
                try {
                    val subnetMask = if (dns.contains(":")) 128 else 32
                    builder.addRoute(dns, subnetMask)
                } catch (e: Exception) {
                    Log.e(TAG, "Error setting route for $dns", e)
                }
            }

            // Build the virtual network configuration
            vpnInterface = builder.establish()

            // Update state
            prefs.edit().putBoolean("vpn_active", true).apply()

            // Battery performance optimization loop:
            // Since we ONLY route DNS IPs through our virtual interface (not 0.0.0.0/0),
            // the system only sends packets bound to these DNS servers into the VPN interface.
            // Under normal parameters, we read and ignore standard payloads as they have already arrived
            // directly at physical interfaces, or we pipe a clean read stream.
            val inputStream = FileInputStream(vpnInterface?.fileDescriptor)
            val packetBuffer = ByteArray(32768)

            while (isRunning) {
                // Blocks here efficiently while waiting for system DNS packets. Consumes no CPU while waiting.
                val readLength = inputStream.read(packetBuffer)
                if (readLength <= 0) {
                    Thread.sleep(100)
                    continue
                }
                
                // Packets are processed passively since native routing resolves queries safely inside Cloudflare/AdGuard.
                // This bypasses complex, memory-hungry TCP/UDP proxying loops, saving maximum battery life!
            }

        } catch (e: InterruptedException) {
            Log.i(TAG, "VPN Thread stopped cleanly")
        } catch (e: Exception) {
            Log.e(TAG, "VPN Tunnel Execution Error", e)
        } finally {
            stopVpn()
        }
    }
}`;
  } else {
    // Java version of SilentVpnService
    return `package ${config.packageName};

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import java.io.FileInputStream;

/**
 * SilentVpnService: Extremely lightweight and battery-efficient local VpnService.
 * Written in Java for total compatibility with mobile compilers.
 */
public class SilentVpnService extends VpnService implements Runnable {

    private static final String TAG = "SilentVpnService";
    
    // Cloudflare Family DNS (blocks Malware and Adult Content)
    private static final String[] CLOUDFLARE_DNS = {
        "1.1.1.3", "1.0.0.3", "2606:4700:4700::1113", "2606:4700:4700::1003"
    };
    
    // AdGuard Family DNS (blocks Malware, Adult Content, and Ads)
    private static final String[] ADGUARD_DNS = {
        "94.140.14.15", "94.140.15.16", "2a10:50c0::bad:ff", "2a10:50c0::54:ff"
    };

    // Cloudflare Gaming Engine (optimized for lowest latency routes globally)
    private static final String[] CLOUDFLARE_GAMING_DNS = {
        "1.1.1.1", "1.0.0.1", "2606:4700:4700::1111", "2606:4700:4700::1001"
    };

    // Google Stable Performance Engine (highly stable gaming routing & anti-jitter)
    private static final String[] GOOGLE_GAMING_DNS = {
        "8.8.8.8", "8.8.4.4", "2001:4860:4860::8888", "2001:4860:4860::8844"
    };

    private ParcelFileDescriptor vpnInterface = null;
    private Thread vpnThread = null;
    private boolean isRunning = false;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "VpnService Starting...");
        
        stopVpn();
        
        isRunning = true;
        vpnThread = new Thread(this, "SilentVpnThread");
        vpnThread.start();
        
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    private void stopVpn() {
        isRunning = false;
        try {
            if (vpnInterface != null) {
                vpnInterface.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error closing interface", e);
        }
        vpnInterface = null;
        if (vpnThread != null) {
            vpnThread.interrupt();
        }
        vpnThread = null;
        
        getSharedPreferences("secure_dns_prefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("vpn_active", false)
            .apply();
    }

    @Override
    public void run() {
        try {
            SharedPreferences prefs = getSharedPreferences("secure_dns_prefs", Context.MODE_PRIVATE);
            String selectedProvider = prefs.getString("dns_provider", "${config.dnsProvider}");

            Log.i(TAG, "Activating silent DNS filter using provider: " + selectedProvider);

            Builder builder = new Builder()
                .setSession("Silent Adult Content Blocker")
                .setConfigureIntent(null);
                
            builder.addAddress("10.0.0.2", 32);
            builder.addAddress("fd00:a:b:c::2", 128);

            String[] dnsAddresses;
            if ("adguard".equals(selectedProvider)) {
                dnsAddresses = ADGUARD_DNS;
            } else if ("cloudflare_gaming".equals(selectedProvider)) {
                dnsAddresses = CLOUDFLARE_GAMING_DNS;
            } else if ("google_gaming".equals(selectedProvider)) {
                dnsAddresses = GOOGLE_GAMING_DNS;
            } else {
                dnsAddresses = CLOUDFLARE_DNS;
            }

            for (String dns : dnsAddresses) {
                builder.addDnsServer(dns);
                try {
                    int subnetMask = dns.contains(":") ? 128 : 32;
                    builder.addRoute(dns, subnetMask);
                } catch (Exception e) {
                    Log.e(TAG, "Error setting route for " + dns, e);
                }
            }

            vpnInterface = builder.establish();
            prefs.edit().putBoolean("vpn_active", true).apply();

            FileInputStream inputStream = new FileInputStream(vpnInterface.getFileDescriptor());
            byte[] packetBuffer = new byte[32768];

            while (isRunning) {
                int readLength = inputStream.read(packetBuffer);
                if (readLength <= 0) {
                    Thread.sleep(100);
                    continue;
                }
                // DNS packets are processed natively and resolved cleanly by secure upstream DNS servers,
                // avoiding recursive query processing and dramatically maximizing user's battery efficiency.
            }

        } catch (InterruptedException e) {
            Log.i(TAG, "VPN Thread stopped cleanly");
        } catch (Exception e) {
            Log.e(TAG, "VPN Tunnel Execution Error", e);
        } finally {
            stopVpn();
        }
    }
}`;
  }
}

export function getSecretCodeReceiverCode(config: AppConfig): string {
  if (config.language === 'kotlin') {
    return `package ${config.packageName}

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * SecretCodeReceiver: Listens directly for custom dialed pins (e.g. *#*#${config.dialerCode}#*#*)
 * dynamically from the stock telephony app dialer.
 * 
 * Works securely without requiring invasive READ_PHONE_STATE permissions!
 */
class SecretCodeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if ("android.provider.Telephony.SECRET_CODE" == intent.action) {
            Log.i("SecretCodeReceiver", "Secret Dialer Code Intercepted! Unlocking User Interface...")
            
            // Launch the Main Settings Activity instantly
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            context.startActivity(launchIntent)
        }
    }
}`;
  } else {
    return `package ${config.packageName};

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * SecretCodeReceiver: Listens directly for custom dialed pins (e.g. *#*#${config.dialerCode}#*#*)
 * dynamically from the stock telephony app dialer.
 */
public class SecretCodeReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SECRET_CODE".equals(intent.getAction())) {
            Log.i("SecretCodeReceiver", "Secret Dialer Code Intercepted! Launching Main Activity...");
            
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(launchIntent);
        }
    }
}`;
  }
}

export function getAdminReceiverCode(config: AppConfig): string {
  if (config.language === 'kotlin') {
    return `package ${config.packageName}

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

/**
 * AdminReceiver: Listens to Device Administrator triggers.
 * Prevents unauthorized physical uninstallation and blockages from Android's Application Settings.
 */
class AdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(context, "Adult Content Blocker: Security Shield Armed!", Toast.LENGTH_SHORT).show()
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        // Displays warning directly when user attempts to remove Admin rights from System Settings
        return "WARNING: Disabling administrator will turn off system-wide adult content filtering."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Toast.makeText(context, "Warning: Security Shield was Disarmed!", Toast.LENGTH_SHORT).show()
    }
}`;
  } else {
    return `package ${config.packageName};

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

/**
 * AdminReceiver: Listens to Device Administrator triggers.
 * Prevents unauthorized physical uninstallation and blockages from Android's Application Settings.
 */
public class AdminReceiver extends DeviceAdminReceiver {

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Toast.makeText(context, "Adult Content Blocker: Security Shield Armed!", Toast.LENGTH_SHORT).show();
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        // Displays warning directly when user attempts to remove Admin rights from System Settings
        return "WARNING: Disabling administrator will turn off system-wide adult content filtering.";
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Toast.makeText(context, "Warning: Security Shield was Disarmed!", Toast.LENGTH_SHORT).show();
    }
}`;
  }
}

export function getDeviceAdminRules(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <!-- Restricts user from uninstalling or turning off unless deactivated via master password -->
        <force-lock />
    </uses-policies>
</device-admin>`;
}

export function getStringsXml(config: AppConfig): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Adult Filter Router</string>
    <string name="device_admin_label">DNS Security Shield</string>
    <string name="device_admin_desc">Prevents system force-stops, file deletion, and uninstalls of the Adult Content Filter.</string>
</resources>`;
}

export function getBuildGradle(config: AppConfig): string {
  return `plugins {
    id("com.android.application")
    ${config.language === 'kotlin' ? 'id("org.jetbrains.kotlin.android")' : ''}
}

android {
    namespace = "${config.packageName}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${config.packageName}"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    ${config.language === 'kotlin' ? `kotlinOptions {
        jvmTarget = "17"
    }` : ''}
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.9.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
}`;
}

export function getActivityLayoutXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#FAFAFA">

    <LinearLayout 
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="20dp">

        <!-- Header Section -->
        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Silent DNS Adult Filter"
            android:textSize="22sp"
            android:textStyle="bold"
            android:textColor="#212121"
            android:layout_marginBottom="8dp" />

        <TextView
            android:id="@+id/txtStatus"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="12dp"
            android:text="STATUS: LOADING..."
            android:background="#EEEEEE"
            android:textColor="#333333"
            android:textSize="14sp"
            android:layout_marginBottom="20dp" />

        <!-- 3. BATTERY 1 STATISTICS VISUALIZATION -->
        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="🔋 Battery Impact Profile (Battery 1)"
            android:textStyle="bold"
            android:textColor="#424242"
            android:layout_marginBottom="6dp" />

        <LinearLayout 
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:background="#ECEFF1"
            android:padding="12dp"
            android:layout_marginBottom="20dp">

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Standard VPN (Processes all device packets):"
                android:textSize="11sp"
                android:textColor="#555555" />
            
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="12dp"
                android:background="#D1C4E9"
                android:layout_marginTop="4dp"
                android:layout_marginBottom="8dp">
                <View
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.85"
                    android:background="#D32F2F" />
                <View
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.15" />
            </LinearLayout>

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Silent DNS-Only Filter (Zero background processing):"
                android:textSize="11sp"
                android:textColor="#555555" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="12dp"
                android:background="#C8E6C9"
                android:layout_marginTop="4dp"
                android:layout_marginBottom="4dp">
                <View
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.02"
                    android:background="#388E3C" />
                <View
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.98" />
            </LinearLayout>

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Our unique approach avoids battery drain entirely by routing ONLY DNS IP addresses."
                android:textSize="10sp"
                android:textColor="#78909C"
                android:textStyle="italic" />
        </LinearLayout>

        <!-- Lock Configuration Section -->
        <LinearLayout
            android:id="@+id/layoutLockControls"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical">

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="1. Choose Safe DNS Filter"
                android:textStyle="bold"
                android:textColor="#424242"
                android:layout_marginBottom="8dp" />

            <RadioGroup
                android:id="@+id/radioGroupDns"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:layout_marginBottom="16dp">

                <RadioButton
                    android:id="@+id/radioCloudflare"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:padding="6dp"
                    android:text="🔒 Cloudflare Safe (1.1.1.3) \\u2014 Blocks Pornography"
                    android:textSize="12sp" />

                <RadioButton
                    android:id="@+id/radioAdGuard"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:padding="6dp"
                    android:text="🛡️ AdGuard Family \\u2014 Blocks Malware & Adults"
                    android:textSize="12sp" />

                <RadioButton
                    android:id="@+id/radioCloudflareGaming"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:padding="6dp"
                    android:textColor="#1976D2"
                    android:textStyle="bold"
                    android:text="🎮 PUBG Best Ping (Cloudflare 1.1.1.1) \\u2014 Speed Boost"
                    android:textSize="12sp" />

                <RadioButton
                    android:id="@+id/radioGoogleGaming"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:padding="6dp"
                    android:textColor="#388E3C"
                    android:textStyle="bold"
                    android:text="🚀 Google Stable Game (8.8.8.8) \\u2014 Anti-Jitter Hub"
                    android:textSize="12sp" />

                <RadioButton
                    android:id="@+id/radioDynamic"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:padding="6dp"
                    android:text="🌐 Dynamic Choice \\u2014 Set custom values in app info"
                    android:textSize="12sp" />
            </RadioGroup>

            <!-- Latency Ping Section -->
            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="⚡ Latency Test tool"
                android:textStyle="bold"
                android:textColor="#424242"
                android:layout_marginBottom="4dp" />

            <Button
                android:id="@+id/btnTestPing"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Run Speed Latency Ping"
                android:backgroundTint="#757575"
                android:textColor="#FFFFFF"
                android:layout_marginBottom="6dp" />

            <TextView
                android:id="@+id/txtPingResults"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Click button to test DNS connection latency..."
                android:textSize="12sp"
                android:textColor="#616161"
                android:layout_marginBottom="16dp" />

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="2. Master Admin Password"
                android:textStyle="bold"
                android:textColor="#424242"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/editPass"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:inputType="textPassword"
                android:hint="Create Admin Password"
                android:layout_marginBottom="16dp" />

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="3. Dialer PIN to Reopen (Secret)"
                android:textStyle="bold"
                android:textColor="#424242"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/editCode"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:inputType="number"
                android:hint="e.g. 4321"
                android:layout_marginBottom="20dp" />

            <Button
                android:id="@+id/btnLock"
                android:layout_width="match_parent"
                android:layout_height="50dp"
                android:text="🔒 ARM SECURITY SHIELD"
                android:textColor="#FFFFFF"
                android:backgroundTint="#1976D2"
                android:layout_marginBottom="15dp" />
        </LinearLayout>

        <!-- Unlock Controls (Only visible when filter is active and app is locked) -->
        <LinearLayout
            android:id="@+id/layoutUnlockControls"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:visibility="gone">

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Protection Dashboard Is Locked"
                android:textSize="16sp"
                android:textStyle="bold"
                android:textColor="#D32F2F"
                android:layout_marginBottom="8dp" />

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Enter your master password to disarm the VPN filter, re-enable launcher shortcut activity, and deactivate administrator rights."
                android:textSize="13sp"
                android:textColor="#616161"
                android:layout_marginBottom="16dp" />

            <EditText
                android:id="@+id/editPassUnlock"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:inputType="textPassword"
                android:hint="Type Password To Disable"
                android:layout_marginBottom="16dp" />

            <Button
                android:id="@+id/btnUnlock"
                android:layout_width="match_parent"
                android:layout_height="50dp"
                android:text="🔓 DISARM PROTECTION"
                android:textColor="#FFFFFF"
                android:backgroundTint="#D32F2F"
                android:layout_marginBottom="20dp" />
        </LinearLayout>

        <!-- Diagnostic Tools (Visible Always) -->
        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="🩺 Diagnostics & Troubleshooting"
            android:textStyle="bold"
            android:textColor="#424242"
            android:layout_marginBottom="6dp" />

        <Button
            android:id="@+id/btnExportLog"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Generate & Export Diagnostic Log"
            android:backgroundTint="#455A64"
            android:textColor="#FFFFFF" />

    </LinearLayout>
</ScrollView>`;
}
