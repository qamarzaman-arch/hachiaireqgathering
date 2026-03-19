# Hachiai Requirements Document

## 1. Overview
- **Project Name:** {{projectName}}
- **Recording Date:** {{date}}
- **Duration:** {{duration}}
- **Environment:** Windows 11

## 2. Executive Summary
{{summary}}

## 3. Workflow Steps
{% for step in steps %}
### Step {{ loop.index }}: {{ step.title }}
- **Application:** {{ step.app_name }}
- **Description:** {{ step.description }}
- **Action Context:** {{ step.context }}

![Step {{ loop.index }} Screenshot]({{ step.screenshot_path }})

---
{% endfor %}

## 4. Inferred Requirements
{{inferredRequirements}}

## 5. Technical Details
- **Total Actions Captured:** {{totalActions}}
- **Average Interaction Time:** {{avgTime}}
