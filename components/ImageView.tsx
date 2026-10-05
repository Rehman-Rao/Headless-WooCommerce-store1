"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import React, { useState } from "react";

interface Props {
  images?: string[];
  isStock?: number | null;
}

const ImageView = ({ images = [], isStock }: Props) => {
  const [active, setActive] = useState(images[0] ?? "");

  return (
    <div className="w-full space-y-2 md:w-1/2 md:space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="group min-h-[450px] w-full overflow-hidden rounded-md border border-darkColor/10"
        >
          {active && (
            <Image
              src={active}
              alt="Product image"
              width={700}
              height={700}
              priority
              unoptimized
              className={`h-96 min-h-[500px] w-full max-h-[550px] rounded-md object-contain hover:scale-110 ${
                isStock === 0 ? "opacity-50" : ""
              }`}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="grid h-20 grid-cols-6 gap-2 md:h-24">
        {images.map((image) => (
          <button
            key={image}
            onClick={() => setActive(image)}
            aria-label="View product image"
            className={`overflow-hidden rounded-md border ${
              active === image ? "border-darkColor opacity-100" : "opacity-80"
            }`}
          >
            <Image
              src={image}
              alt="Product thumbnail"
              width={100}
              height={100}
              unoptimized
              className="h-auto w-full object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageView;
