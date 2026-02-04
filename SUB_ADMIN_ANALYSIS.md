# Sub-Admin Feature Analysis

## Current State

### 1. **Role System**
- **Current Roles**: Only `ADMIN` and `USER` exist in the Prisma schema
- **Location**: `prisma/schema.prisma` (lines 23-26)
- **User Model**: Users have a `role` field with default `USER`

### 2. **User Registration**
- **Endpoint**: `POST /auth/register`
- **Controller**: `src/auth/auth.controller.ts` (lines 21-26)
- **Service**: `src/auth/auth.service.ts` (lines 23-48)
- **Current Behavior**:
  - Only `ADMIN` users can register new users
  - Admins can assign any role (including `ADMIN`) when creating users
  - No restrictions on who can create admins

### 3. **Authorization System**
- **Guard**: `src/common/guards/roles.guard.ts`
- **Decorator**: `src/common/decorators/roles.decorator.ts`
- **How it works**: Checks if the user's role matches the required roles specified by `@Roles()` decorator
- **Admin-protected endpoints**: Found in multiple controllers:
  - `auth.controller.ts` - User registration
  - `dashboard.controller.ts` - Admin dashboard
  - `hotels.controller.ts` - Hotel management (10 endpoints)
  - `trips.controller.ts` - Trip management (5 endpoints)
  - `places.controller.ts` - Place management (7 endpoints)
  - `activities.controller.ts` - Activity management (3 endpoints)
  - `countries.controller.ts` - Country management (3 endpoints)
  - `cities.controller.ts` - City management (3 endpoints)
  - `categories.controller.ts` - Category management (2 endpoints)
  - `themes.controller.ts` - Theme management (2 endpoints)
  - `reservations.controller.ts` - Reservation management (3 endpoints)
  - `trip-reservations.controller.ts` - Trip reservation management (3 endpoints)
  - `embeddings.controller.ts` - Embedding management (3 endpoints)
  - `storage.controller.ts` - File upload (1 endpoint)

## What Needs to Change for Sub-Admins

### Option 1: Sub-Admins Have Same Permissions as Admins (Simpler)
If sub-admins should have the same access as full admins:

1. **Add SUB_ADMIN role to Prisma schema**
   ```prisma
   enum Role {
     ADMIN
     SUB_ADMIN
     USER
   }
   ```

2. **Update RolesGuard** to allow SUB_ADMIN where ADMIN is required
   - Modify `src/common/guards/roles.guard.ts` to treat SUB_ADMIN as ADMIN
   - Or update all `@Roles(Role.ADMIN)` to `@Roles(Role.ADMIN, Role.SUB_ADMIN)`

3. **Update register method** to allow admins to create sub-admins
   - Already supports this (can assign any role)
   - Add validation: Only full ADMINs can create SUB_ADMIN or ADMIN users
   - SUB_ADMINs should NOT be able to create other admins/sub-admins

### Option 2: Sub-Admins Have Restricted Permissions (More Complex)
If sub-admins should have limited access:

1. **Define which endpoints sub-admins can access**
   - Create a permission system or role hierarchy
   - Update each controller to allow SUB_ADMIN where appropriate

2. **Restrict sub-admin actions**
   - Sub-admins cannot create/delete other admins
   - Sub-admins cannot modify certain critical settings
   - Sub-admins can only manage specific resources

## Recommended Implementation (Option 1 - Simpler)

### Step 1: Database Schema Changes
```prisma
enum Role {
  ADMIN
  SUB_ADMIN
  USER
}
```

### Step 2: Update RolesGuard
Modify the guard to allow SUB_ADMIN to access ADMIN-protected endpoints:
- Option A: Update guard logic to treat SUB_ADMIN as ADMIN
- Option B: Update all decorators to include both roles

### Step 3: Update Registration Logic
Add validation in `auth.service.ts`:
- Only `ADMIN` can create `SUB_ADMIN` or `ADMIN` users
- `SUB_ADMIN` can only create `USER` accounts
- `SUB_ADMIN` cannot create other `SUB_ADMIN` or `ADMIN` users

### Step 4: Migration
Create a Prisma migration to add the new role enum value.

## Files That Need Modification

1. **`prisma/schema.prisma`**
   - Add `SUB_ADMIN` to Role enum

2. **`src/auth/auth.service.ts`**
   - Update `register()` method to add role-based validation
   - Prevent SUB_ADMIN from creating ADMIN/SUB_ADMIN users

3. **`src/common/guards/roles.guard.ts`**
   - Update to allow SUB_ADMIN access to ADMIN endpoints
   - OR create a helper function to check admin-level access

4. **All controller files with `@Roles(Role.ADMIN)`**
   - Either update decorators to include SUB_ADMIN
   - OR update the guard to handle it automatically

## Considerations

1. **Backward Compatibility**: Existing ADMIN users will continue to work
2. **Security**: Ensure SUB_ADMIN cannot escalate privileges
3. **Audit Trail**: Consider logging who created which users
4. **User Management**: May want to add endpoints to list/update/delete users
5. **Role Assignment**: Consider if roles can be changed after user creation

## Questions to Answer

1. Should SUB_ADMIN have the same permissions as ADMIN, or restricted?
2. Can SUB_ADMIN create other SUB_ADMIN users, or only regular users?
3. Should there be a way to promote/demote users between roles?
4. Do you need user management endpoints (list, update, delete users)?
5. Should SUB_ADMIN be able to see all users or only users they created?

