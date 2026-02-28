
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleChangePassword = () => {
    setIsSaving(true)
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all password fields." })
      setIsSaving(false)
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "New passwords do not match." })
      setIsSaving(false)
      return
    }
    setTimeout(() => {
      if (currentPassword !== "password") {
        toast({ variant: "destructive", title: "Error", description: "Your current password is not correct." })
      } else {
        toast({ title: "Success", description: "Your password has been changed successfully." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
      setIsSaving(false)
    }, 1000)
  }
  
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and application settings."
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your login password. After saving, you will need to use the
              new password for your next login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSaving} />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Password"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
