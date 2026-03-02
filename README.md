# Wordpress Sleep Apnea Quiz

WordPress plugin that adds a modern step-by-step sleep apnea risk quiz based on the STOP-BANG methodology.

## Installation

1. Copy the plugin folder into `wp-content/plugins/`.
2. Activate the plugin in the WordPress admin panel.
3. Insert the shortcode on any page or post.

## Main Shortcode

```text
[sleep_apnea_quiz]
```

## Scoring Logic

- `0-2` points: low risk of obstructive sleep apnea.
- `3-4` points: moderate risk of sleep apnea.
- `5-8` points: high risk of sleep apnea.
- High risk also applies when there are at least `2` positive answers in questions `1-4` and a positive answer in question `5`, `7`, or `8`.
