#!/bin/bash

# Add 'export const dynamic = "force-dynamic"' to all API routes that don't have it

for file in $(find src/app/api -name "route.ts" -type f); do
    if ! grep -q "export const dynamic" "$file"; then
        # Find the first import line
        import_line=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)
        
        if [ ! -z "$import_line" ]; then
            # Insert the dynamic export before the first import
            sed -i "${import_line}i export const dynamic = 'force-dynamic';\n" "$file"
            echo "✓ Fixed: $file"
        fi
    else
        echo "✓ Already has dynamic: $file"
    fi
done
