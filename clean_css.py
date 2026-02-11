#!/usr/bin/env python3
"""
Clean up orphaned CSS blocks left by sed animation stripping.
Pattern: /* keyframe removed */ followed by orphaned { } blocks
"""
import re
import sys

def clean_css_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Pattern 1: /* keyframe removed */ followed by orphaned block content
    # Example:
    # /* keyframe removed */
    #
    #     to {
    #         opacity: 1;
    #     }
    # }
    
    # Remove: comment + whitespace + orphaned block until standalone }
    pattern = r'/\*\s*keyframe removed\s*\*/\s*\n\s*(?:(?:to|from|\d+%)\s*\{[^}]*\}\s*)*\}(?=\s*\n)'
    content = re.sub(pattern, '', content, flags=re.MULTILINE)
    
    # Pattern 2: Standalone orphaned blocks after the comment was already removed
    # Example:
    #     50% {
    #         transform: scale(1.1);
    #     }
    # }
    # (where the keyframe name is missing)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

if __name__ == '__main__':
    import glob
    
    css_files = glob.glob('src/**/*.css', recursive=True)
    fixed = 0
    
    for f in css_files:
        if clean_css_file(f):
            print(f'Cleaned: {f}')
            fixed += 1
    
    print(f'\nTotal files cleaned: {fixed}')
