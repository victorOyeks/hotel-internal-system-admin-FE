
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ConstructionIcon, 
  MessageCircleIcon, 
  ClockIcon, 
  ArrowLeftIcon,
  WrenchIcon,
  HardHatIcon
} from "lucide-react";
import Link from "next/link";

function Page() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon Section */}
          <div className="relative">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary-5 to-primary-4 rounded-full flex items-center justify-center mb-4">
              <ConstructionIcon className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 bg-secondary-4 rounded-full flex items-center justify-center">
                <HardHatIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -left-2">
              <div className="w-6 h-6 bg-primary-3 rounded-full flex items-center justify-center">
                <WrenchIcon className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary-6 text-primary-1 border-primary-5/30">
              <ClockIcon className="w-4 h-4 mr-2" />
              Under Development
            </Badge>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary-1 flex items-center justify-center gap-3">
              <MessageCircleIcon className="w-8 h-8 text-primary" />
              Messages Center
            </h1>
            <p className="text-lg text-primary-2">
              We're building something amazing for you!
            </p>
          </div>

          {/* Description */}
          <div className="bg-primary-6/50 border border-primary-5/20 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-primary-1">Coming Soon:</h3>
            <ul className="text-left space-y-2 text-primary-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-4 rounded-full"></div>
                Real-time messaging with hotel managers
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-4 rounded-full"></div>
                Broadcast notifications to all hotels
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-4 rounded-full"></div>
                Message history and conversation threads
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-4 rounded-full"></div>
                File attachments and multimedia support
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-4 rounded-full"></div>
                Push notifications for instant alerts
              </li>
            </ul>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-primary-2">
              <span>Development Progress</span>
              <span>65%</span>
            </div>
            <div className="w-full bg-primary-6/30 rounded-full h-2">
              <div className="bg-gradient-to-r from-primary-4 to-primary-3 h-2 rounded-full transition-all duration-300" style={{ width: '5%' }}></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1 border-primary-5/30 text-primary-1 hover:bg-primary-6/30">
              <Link href="/dashboard">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild className="flex-1 bg-primary-4 hover:bg-primary-3">
              <Link href="/dashboard/hotels">
                <MessageCircleIcon className="w-4 h-4 mr-2" />
                Contact via Hotels
              </Link>
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-primary-2/70 pt-4 border-t border-primary-5/20">
            This is just a joke. Page will be built after all modules are done.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Page;