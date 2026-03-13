# iPIXEL Color - Example Automations

This folder contains sample Home Assistant automations and configurations to help you get the most out of your iPIXEL Color display.

## Files

| File | Description |
|------|-------------|
| `automations.yaml` | 12 ready-to-use automation examples |
| `helpers.yaml` | Input helpers, scripts, and Lovelace card examples |

## Automation Examples

### Weather & Time
1. **Weather Display** - Current time, weather icon, and temperature (updates every minute)
2. **Hourly Forecast** - Next 5 hours with weather icons
3. **Daily Forecast** - 5-day forecast with weekday abbreviations

### Information Display
4. **News Headlines** - Cycling RSS feed headlines
5. **Calendar Events** - Upcoming calendar events
6. **System Status** - Server disk space and update alerts
7. **Network Speed** - Speedtest download/upload/ping results
8. **Thermostat Status** - Indoor temperature and heating/cooling status
9. **Daily Quote** - Inspirational quote of the day
10. **Rotating Display** - Cycles through all content types automatically

### Utility
11. **Notification Display** - Show custom notifications from other automations
12. **Clock Mode Schedule** - Night/morning mode switching

## Quick Start

### 1. Copy Automations

Copy the automations you want from `automations.yaml` to your Home Assistant:

**Option A:** Via UI
- Go to **Settings** > **Automations & Scenes**
- Click **+ Create Automation**
- Click the menu (⋮) > **Edit in YAML**
- Paste the automation YAML

**Option B:** Via File
- Add to your `automations.yaml` file

### 2. Update Entity IDs

Replace these placeholder entity IDs with your actual entities:

```yaml
# Change these to match your setup:
light.ipixel_color          # Your iPIXEL light entity
weather.home                # Your weather entity
calendar.personal           # Your calendar entity
sensor.speedtest_download   # Speedtest sensors
climate.thermostat          # Your thermostat
```

### 3. Add Helper Entities (Optional)

For the notification and custom text features, create these helpers:

**Via UI:** Settings > Devices & Services > Helpers > + Create Helper

| Type | Name | Settings |
|------|------|----------|
| Text | iPIXEL Notification | Max length: 100 |
| Text | iPIXEL Custom Text | Max length: 100 |
| Toggle | iPIXEL Display Enabled | - |
| Number | iPIXEL Display Index | Min: 0, Max: 20 |

## Available Services

The iPIXEL Color integration provides these services:

```yaml
# Display text with colors
service: ipixel_color.display_text
data:
  text: "Hello World!"
  text_color: "ff0000"    # Red
  bg_color: "000000"      # Black background

# Show clock mode
service: ipixel_color.set_clock_mode
data:
  style: 1                # 0-8 different styles
  format_24: true
  show_date: true

# Set brightness
service: ipixel_color.set_brightness
data:
  brightness: 80          # 1-100

# Clear display
service: ipixel_color.clear_display

# Display image from URL
service: ipixel_color.display_image_url
data:
  url: "https://example.com/image.png"

# Display GIF animation
service: ipixel_color.display_image_url
data:
  url: "https://example.com/animation.gif"
```

## Color Reference

Common hex colors for `text_color` and `bg_color`:

| Color | Hex Code |
|-------|----------|
| White | `ffffff` |
| Black | `000000` |
| Red | `ff0000` |
| Green | `00ff00` |
| Blue | `0000ff` |
| Yellow | `ffff00` |
| Cyan | `00ffff` |
| Magenta | `ff00ff` |
| Orange | `ff6600` |
| Purple | `cc88ff` |
| Light Blue | `00a0ff` |

## Weather Icons

The automations use these emoji weather icons:

| Condition | Icon |
|-----------|------|
| sunny/clear | ☀ |
| clear-night | 🌙 |
| partlycloudy | ⛅ |
| cloudy | ☁ |
| fog | 🌫 |
| rainy/pouring | 🌧 |
| lightning-rainy | ⛈ |
| lightning | 🌩 |
| snowy | 🌨 |
| snowy-rainy | 🌧🌨 |
| hail | 🧊 |
| windy | 🍃 |
| exceptional | ⚠️ |

## Tips

### Scrolling Text
For long text that doesn't fit on the display, the integration automatically handles scrolling.

### Triggering Notifications from Other Automations
Use the notification input helper:

```yaml
- service: input_text.set_value
  target:
    entity_id: input_text.ipixel_notification
  data:
    value: "Motion detected in garage!"
```

### Conditional Display Based on Presence
Add a condition to only show when someone is home:

```yaml
conditions:
  - condition: state
    entity_id: person.your_name
    state: "home"
```

### Brightness by Time of Day
Automatically adjust brightness:

```yaml
- service: light.turn_on
  target:
    entity_id: light.ipixel_color
  data:
    brightness_pct: >-
      {% set hour = now().hour %}
      {% if hour >= 22 or hour < 7 %}20
      {% elif hour >= 7 and hour < 9 %}60
      {% else %}100{% endif %}
```

## Device State Limitation

Note: The iPIXEL protocol does not support reading the current display content. The integration tracks state locally based on commands sent, but cannot query what is actually shown on the display.
