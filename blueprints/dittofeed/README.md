use the below template to build a form to get users to your dittofeed .

substitute you details where it is mentioned.

Happy Building - CYBERSLIDE


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dittofeed Signup Template</title>

    <script type="text/javascript">
      var _df = _df || [];
      (function () {
        var methods = ["track", "identify", "page", "flush", "subscribe", "unsubscribe", "getAnonymousId", "resetAnonymousId"];
        methods.forEach(function (method) {
          _df[method] = function () {
            _df.push([method].concat(Array.prototype.slice.call(arguments)));
          };
        });
        var script = document.createElement("script");
        script.type = "module";
        script.async = true;
        
        // A. Script Source (Keep this as is, or change to your self-hosted URL if preferred)
        script.src = "https://app.dittofeed.com/dashboard/public/dittofeed.umd.js";
        script.id = "df-tracker";
        
        // B. YOUR WRITE KEY
        // Find this in: Settings > API Keys > Write Key
        script.setAttribute("data-write-key", "{{ PASTE_YOUR_WRITE_KEY_HERE }}");
        
        // C. YOUR SERVER URL
        // The URL where your Dittofeed dashboard lives (e.g., https://ditto.yourdomain.com)
        script.setAttribute("data-host", "{{ PASTE_YOUR_DITTOFEED_URL_HERE }}");
        
        document.head.appendChild(script);
      })();
    </script>
</head>
<body>

    <form id="df-form">
        <label>First Name: <input type="text" id="fname" required></label>
        <label>Email: <input type="email" id="email" required></label>
        <button type="submit" id="btn">Subscribe</button>
        <div id="msg"></div>
    </form>

    <script>
        document.getElementById('df-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = document.getElementById('btn');
            const msg = document.getElementById('msg');
            const email = document.getElementById('email').value;
            const fname = document.getElementById('fname').value;

            // D. YOUR SUBSCRIPTION GROUP ID
            // Find this in: Dashboard > Subscription Groups > Click your group > Copy ID
            const SUB_GROUP_ID = '{{ PASTE_YOUR_SUBSCRIPTION_GROUP_ID_HERE }}';

            if(window._df) {
                btn.disabled = true;
                btn.innerText = "Sending...";

                // E. CUSTOM TRAITS (Optional)
                // You can add or remove fields inside the 'traits' object below.
                _df.identify({
                    userId: email,
                    traits: {
                        email: email,
                        firstName: fname,
                        HTF: 'yes' // Example custom trait
                    },
                    subscriptionGroups: {
                        [SUB_GROUP_ID]: true
                    }
                });

                btn.innerText = "Done";
                msg.innerText = "Success. Check Dittofeed.";
            } else {
                console.error("SDK not loaded");
                msg.innerText = "Error: SDK failed to load.";
            }
        });
    </script>

</body>
</html>